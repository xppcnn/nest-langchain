import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, GoogleProfile } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private isConfigured: boolean;

  constructor(
    configService: ConfigService,
    @Optional() private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // 如果没有配置 Google OAuth，使用占位符（策略不会被使用）
    super({
      clientID: clientID || 'placeholder-client-id',
      clientSecret: clientSecret || 'placeholder-client-secret',
      callbackURL: callbackURL || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });

    this.isConfigured = !!(clientID && clientSecret);

    if (!this.isConfigured) {
      console.warn(
        '⚠️  Google OAuth 未配置。请设置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 环境变量以启用 Google 登录。',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    if (!this.isConfigured) {
      return done(new Error('Google OAuth 未配置'), false);
    }

    const { id, displayName, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      id,
      email: emails?.[0]?.value || '',
      displayName,
      picture: photos?.[0]?.value,
    };

    const user = await this.authService.validateGoogleUser(googleProfile);
    done(null, user);
  }
}

