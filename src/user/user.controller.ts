import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards';
import { CurrentUser } from '@/auth/decorators';
import type { SafeUser } from '@/database/schema';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息
   * GET /users/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    return this.userService.getProfile(userId);
  }

  /**
   * 获取当前用户（直接从 token 中获取）
   * GET /users/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@CurrentUser() user: SafeUser) {
    return user;
  }
}
