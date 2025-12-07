import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 标记路由为公开访问，不需要 JWT 认证
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

