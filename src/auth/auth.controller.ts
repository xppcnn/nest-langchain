import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, TokenResponse } from './auth.service';
import { RegisterDto } from './dto';
import { LocalAuthGuard, GoogleAuthGuard, JwtAuthGuard } from './guards';
import { Public, CurrentUser } from './decorators';
import type { User } from '../database/schema';

// 扩展 Express Request 类型
interface RequestWithUser extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== 本地注册登录 ====================

  /**
   * 用户注册
   * POST /auth/register
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * 用户登录
   * POST /auth/login
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req: RequestWithUser): Promise<TokenResponse> {
    // LocalAuthGuard 已经验证了用户，用户信息在 req.user 中
    return this.authService.generateTokens(req.user);
  }

  // ==================== Google OAuth ====================

  /**
   * 发起 Google OAuth 登录
   * GET /auth/google
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {
    // Google OAuth 重定向由 Passport 处理
  }

  /**
   * Google OAuth 回调
   * GET /auth/google/callback
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ): Promise<void> {
    const tokens = await this.authService.googleLogin(req.user);

    // 重定向到前端，并传递 tokens
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    // 可以选择将 tokens 作为 URL 参数传递给前端
    // 或者设置 httpOnly cookie
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  // ==================== Token 管理 ====================

  /**
   * 刷新 Access Token
   * POST /auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
  ): Promise<TokenResponse> {
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * 登出
   * POST /auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: number,
    @Body('refreshToken') refreshToken?: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, refreshToken);
    return { message: '登出成功' };
  }

  /**
   * 登出所有设备
   * POST /auth/logout-all
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: number,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: '已登出所有设备' };
  }
}
