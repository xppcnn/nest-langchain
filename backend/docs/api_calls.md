# API cURL Scripts

This document contains cURL commands for interacting with the application's API endpoints.

**Note:** Replace placeholders like `http://localhost:3000`, `<YOUR_ACCESS_TOKEN>`, and `<YOUR_REFRESH_TOKEN>` with your actual data.

---

### 1. Register a New User

Registers a new user with the provided credentials.

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123"
  }'
```

---

### 2. Login with Email and Password

Authenticates a user and returns an access token and a refresh token.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password123"
  }'
```

---

### 3. Google OAuth Login

Redirects the user to the Google OAuth consent screen. This is typically done in a web browser, so a direct `curl` call is not the standard way to initiate this flow. The command below shows how to start the flow, but you would need to handle the redirect and the callback from Google in your application.

```bash
# This will return a 302 Redirect to the Google login page.
# You would then complete the flow in a browser.
curl -L http://localhost:3000/auth/google
```

---

### 4. Refresh Token

Generates a new pair of access and refresh tokens using a valid refresh token.

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<YOUR_REFRESH_TOKEN>"
  }'
```

---

### 5. Logout

Invalidates the user's refresh token. You should also delete the access token on the client side.

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<YOUR_REFRESH_TOKEN>"
  }'
```
*Note: The `refreshToken` is optional in the body. If not provided, all refresh tokens for the user will be invalidated.*

---

### 6. Get User Profile

Retrieves the profile of the currently authenticated user.

```bash
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdHVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzY1MDEzNjgzLCJleHAiOjE3NjUwMTQ1ODN9.UN0FlOIchXW5DazAlV4KlK_nMgj1E2se7xo1pAtTx-s"
```
