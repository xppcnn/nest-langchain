import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users, refreshTokens, User, NewUser } from '../database/schema';
import { RegisterDto, LoginDto } from './dto';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== 本地注册登录 ====================

  async register(registerDto: RegisterDto): Promise<TokenResponse> {
    const { name, email, password } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const [newUser] = await this.db.db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        provider: 'local',
      })
      .returning();

    return this.generateTokens(newUser);
  }

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查是否是本地用户
    if (user.provider !== 'local' || !user.password) {
      throw new UnauthorizedException(
        '该账户使用 Google 登录，请使用 Google 登录',
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.generateTokens(user);
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || user.provider !== 'local' || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  // ==================== Google OAuth ====================

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const { id, email, displayName, picture } = profile;

    // 查找是否已存在该 Google 用户
    let user = await this.db.query.users.findFirst({
      where: and(eq(users.provider, 'google'), eq(users.providerId, id)),
    });

    if (user) {
      return user;
    }

    // 检查邮箱是否已存在（本地注册的用户）
    const existingEmailUser = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingEmailUser) {
      // 如果本地用户存在，关联 Google 账户
      const [updatedUser] = await this.db.db
        .update(users)
        .set({
          provider: 'google',
          providerId: id,
          avatar: picture,
          isEmailVerified: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingEmailUser.id))
        .returning();

      return updatedUser;
    }

    // 创建新的 Google 用户
    const [newUser] = await this.db.db
      .insert(users)
      .values({
        name: displayName,
        email,
        provider: 'google',
        providerId: id,
        avatar: picture,
        isEmailVerified: new Date(),
      })
      .returning();

    return newUser;
  }

  async googleLogin(user: User): Promise<TokenResponse> {
    return this.generateTokens(user);
  }

  // ==================== JWT 相关 ====================

  async generateTokens(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: 604800, // 7 天 (以秒为单位)
    });

    // 保存 refresh token 到数据库
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 天后过期

    await this.db.db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refreshTokens(token: string): Promise<TokenResponse> {
    try {
      // 验证 refresh token
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 检查 token 是否在数据库中
      const storedToken = await this.db.query.refreshTokens.findFirst({
        where: and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.userId, payload.sub),
        ),
      });

      if (!storedToken) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 检查是否过期
      if (new Date() > storedToken.expiresAt) {
        // 删除过期的 token
        await this.db.db
          .delete(refreshTokens)
          .where(eq(refreshTokens.id, storedToken.id));
        throw new UnauthorizedException('刷新令牌已过期');
      }

      // 删除旧的 refresh token
      await this.db.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, storedToken.id));

      // 获取用户信息
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 生成新的 tokens
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // 删除特定的 refresh token
      await this.db.db
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, userId),
            eq(refreshTokens.token, refreshToken),
          ),
        );
    } else {
      // 删除用户所有的 refresh tokens（登出所有设备）
      await this.db.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
    }
  }

  // ==================== 用户验证 ====================

  async validateUserById(id: number): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user ?? null;
  }

  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

