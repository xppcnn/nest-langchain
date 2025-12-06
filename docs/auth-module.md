## Auth 模块说明

### 概览
- 支持本地账号密码登录与 Google OAuth 登录，统一生成 JWT（短期 access token + 长期 refresh token）。
- 全局 `JwtAuthGuard` 拦截所有路由，结合 `@Public()` 控制匿名访问。
- 数据持久化使用 Drizzle ORM（Postgres），存储用户与刷新令牌。

### 主要组成
- `AuthModule`
  - 引入 `DrizzleModule`、`PassportModule`（默认策略 `jwt`）、`JwtModule`（access token 15 分钟，使用 `JWT_SECRET`）。
  - 异步注册 `JwtModule` 以读取配置。
- 策略（`src/auth/strategies`）
  - `LocalStrategy`: 使用 email/password 验证本地用户（`validateLocalUser`）。
  - `JwtStrategy`: 从 Bearer Token 解析 payload，调用 `validateUserById` 取得用户实例；过期或用户不存在则拒绝。
  - `GoogleStrategy`: passport-google-oauth20，需配置 `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`，未配置时打印警告并返回错误。
- 守卫（`src/auth/guards`）
  - `JwtAuthGuard`: 读取 `@Public()` 元数据决定是否放行，否则使用 `jwt` 策略校验。
  - `LocalAuthGuard`: 绑定 `local` 策略。
  - `GoogleAuthGuard`: 绑定 `google` 策略。
- 装饰器（`src/auth/decorators`）
  - `@Public()`: 将路由标记为匿名可访问。
  - `@CurrentUser([key])`: 读取 `request.user`，可选字段提取。
- DTO（`src/auth/dto`）
  - `RegisterDto`: name/email/password，包含长度与复杂度校验。
  - `LoginDto`: email/password。
- 服务（`AuthService`）
  - 负责用户注册/登录、Google 用户创建或关联、token 生成与刷新、登出、用户信息查询。

### 数据模型（`src/database/schema/index.ts`）
- `users`
  - `provider`: `'local' | 'google'`; `providerId` 记录第三方 ID。
  - `password` 可为空（OAuth 用户）。
  - `isEmailVerified`, `avatar` 等补充字段。
- `refreshTokens`
  - `token` 唯一，`userId` 外键（级联删除），`expiresAt` 过期时间。

### 环境变量
- `DATABASE_URL`：Postgres 连接串。
- `JWT_SECRET`：签发 access token；有效期 15 分钟。
- `JWT_REFRESH_SECRET`：签发 refresh token；有效期 7 天。
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`：Google OAuth。
- `FRONTEND_URL`：Google 回调后重定向前端地址（默认 `http://localhost:5173`）。

### 认证与授权流程
- 注册 `POST /auth/register` (`@Public`)
  - 检查邮箱唯一性 → bcrypt(12) 加密密码 → `provider=local` 创建用户 → `generateTokens` 返回 access/refresh。
- 本地登录 `POST /auth/login` (`@Public` + `LocalAuthGuard`)
  - `LocalStrategy` 校验 email/password（仅限 `provider=local`）→ 已在 `req.user` → `generateTokens`。
- Google OAuth
  - 发起：`GET /auth/google` (`@Public` + `GoogleAuthGuard`) 触发 Passport 重定向。
  - 回调：`GET /auth/google/callback` (`@Public` + `GoogleAuthGuard`)
    - `GoogleStrategy.validate` 通过 `validateGoogleUser`：若 providerId 匹配则返回；若邮箱已有本地用户则升级为 Google 账号并标记邮箱验证；否则创建新用户。
    - 登录成功后重定向到 `${FRONTEND_URL}/auth/callback` 并附带 access/refresh token 查询参数（可改为 httpOnly cookie）。
- Token 刷新 `POST /auth/refresh` (`@Public`)
  - 验证 refresh token（`JWT_REFRESH_SECRET`）→ 查库确保存在且未过期 → 删除旧 token → 重新生成一对 tokens 并存库。
- 登出
  - `POST /auth/logout` (`JwtAuthGuard`)：删除当前用户的指定 refresh token。
  - `POST /auth/logout-all` (`JwtAuthGuard`)：删除当前用户所有 refresh tokens。
- 用户信息
  - `GET /auth/profile` (`JwtAuthGuard`): 从 DB 读取最新用户信息（移除密码）。
  - `GET /auth/me` (`JwtAuthGuard`): 直接返回策略注入的用户对象（移除密码）。

### Token 设计
- Access token: 15 分钟过期，payload 包含 `sub`（user id）、`email`、`name`。
- Refresh token: 7 天过期，存库并可按 token 级别撤销；刷新时先删除旧 token，生成新的一对。

### 注意事项/改进建议
- Google 未配置时策略会报错并记录警告：在非本地环境需确保相关 env 存在。
- Refresh token 单表未做设备标识，若需设备级管理可增加 UA/设备字段。
- `/auth/google/callback` 当前通过查询参数回传 tokens，如需更安全可改为 httpOnly cookie 并使用 state/nonce 防 CSRF。
