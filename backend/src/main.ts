import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除非白名单属性
      forbidNonWhitelisted: true, // 非白名单属性会抛出错误
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS 配置
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  );
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API endpoints:`);
  console.log(`   POST /auth/register    - 注册新用户`);
  console.log(`   POST /auth/login       - 邮箱密码登录`);
  console.log(`   GET  /auth/google      - Google OAuth 登录`);
  console.log(`   POST /auth/refresh     - 刷新 Token`);
  console.log(`   POST /auth/logout      - 登出`);
  console.log(`   GET  /auth/profile     - 获取用户信息`);
}
bootstrap();
