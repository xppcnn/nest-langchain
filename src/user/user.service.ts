import { Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { users, User, SafeUser } from '../database/schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: number): Promise<SafeUser | null> {
    const user = await this.drizzle.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        password: false,
      },
    });
    return user ?? null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.drizzle.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user ?? null;
  }

  async getProfile(userId: number): Promise<SafeUser> {
    const user = await this.findById(userId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  toSafeUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(
    name: string,
    email: string,
    password: string,
    provider: 'local' | 'google',
  ): Promise<User> {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);
    // 创建用户
    const [newUser] = await this.drizzle.db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        provider,
      })
      .returning();
    return newUser;
  }
}
