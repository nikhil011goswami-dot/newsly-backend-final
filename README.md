# Newsly Backend — Phase 1 Authentication API

Production NestJS authentication backend for the Newsly app.

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 (TypeScript strict) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache / Sessions | Redis 7 + ioredis |
| Auth | JWT (access) + Rotating Refresh Tokens |
| Passwords | Argon2id |
| Social login | Google OAuth 2.0, Apple Sign-In |
| Email | Nodemailer (SMTP) |
| Rate limiting | @nestjs/throttler |
| API docs | Swagger / OpenAPI |
| Storage | AWS S3 |
| Process manager | PM2 |
| Reverse proxy | Nginx |

---

## Features

- **Email Registration** — with email verification
- **Email Login** — Argon2id password verification
- **Google Login** — ID token verification
- **Apple Login** — Identity token verification
- **JWT Access Tokens** — 15-minute lifetime, HS256
- **Rotating Refresh Tokens** — 30-day lifetime, SHA-256 hashed in DB
- **Refresh Token Reuse Detection** — session invalidated on token reuse
- **Multiple Device Sessions** — independent sessions per device
- **Logout** (current device) and **Logout All**
- **Forgot / Reset Password** — time-limited tokens, user-enumeration safe
- **Change Password** — invalidates all sessions
- **RBAC** — USER / EDITOR / ADMIN roles via `@Roles()` guard
- **User Profile Management** — update profile, change language/categories
- **Device Management** — list and revoke sessions
- **Soft Delete** — accounts anonymised, not hard-deleted
- **Audit Logging** — structured request/response logs via Winston
- **Health Check** — `/health` endpoint (DB + Redis status)
- **Rate Limiting** — per-route throttling

---

## Prerequisites

- Node.js 20+
- pnpm (or npm)
- PostgreSQL 16
- Redis 7
- Docker (optional, for local dev)

---

## Local Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd newsly-backend
npm install
```

### 2. Start infrastructure (Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL on `5432` and Redis on `6379`.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required env vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `JWT_ACCESS_SECRET` | Access token signing secret (min 32 chars) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `APPLE_CLIENT_ID` | Apple bundle ID |

### 4. Run database migrations

```bash
npm run prisma:migrate
npm run prisma:seed    # Seeds admin user + categories
```

### 5. Start dev server

```bash
npm run start:dev
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/api/docs`

---

## API Endpoints

### Auth `/api/v1/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register with email & password |
| GET | `/verify-email?token=` | Verify email from link |
| POST | `/login` | Login with email & password |
| POST | `/google` | Login / register with Google ID token |
| POST | `/apple` | Login / register with Apple identity token |
| POST | `/refresh` | Rotate refresh token |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password using emailed token |
| POST | `/logout` | Logout current device 🔒 |
| POST | `/logout-all` | Logout all devices 🔒 |

### Users `/api/v1/users` 🔒

| Method | Path | Description |
|---|---|---|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile |
| POST | `/me/change-password` | Change password |
| DELETE | `/me` | Soft-delete account |
| GET | `/me/sessions` | List active sessions |
| DELETE | `/me/sessions/:id` | Revoke a specific session |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | DB + Redis health check |

---

## Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Error

```json
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": ["Invalid email or password"],
  "error": "UnauthorizedException"
}
```

---

## Authentication Flow

```
Register → Verify Email → Login → [access token + refresh token]
                                       ↓
                              Use access token (15 min)
                                       ↓ (expired)
                              POST /refresh → new pair
                                       ↓
                              Logout (revoke session)
```

---

## Deployment (AWS EC2 + RDS + ElastiCache)

### 1. Server setup (Ubuntu 24)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Deploy application

```bash
# Clone repo on server
git clone <repo-url> /var/www/newsly-backend
cd /var/www/newsly-backend

# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Seed (first deploy only)
npm run prisma:seed
```

### 3. Configure Nginx

```bash
sudo cp nginx/newsly.conf /etc/nginx/sites-available/newsly
sudo ln -s /etc/nginx/sites-available/newsly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL certificate

```bash
sudo certbot --nginx -d api.newsly.app
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Enable auto-start on reboot
```

### 6. Environment variables on server

Create `/var/www/newsly-backend/.env` with all production values. Never commit this file.

---

## Flutter Integration

### Base URL

```dart
const String baseUrl = 'https://api.newsly.app/api/v1';
```

### Authentication flow

```dart
// 1. Register
POST /auth/register
Body: { email, password, fullName }

// 2. Login
POST /auth/login
Body: { email, password, deviceId, deviceName, platform }
Response: { accessToken, refreshToken, expiresIn, user }

// 3. Authenticated requests
Header: Authorization: Bearer <accessToken>

// 4. Refresh tokens (run before expiry)
POST /auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken, expiresIn }

// 5. Logout
POST /auth/logout
Header: Authorization: Bearer <accessToken>
```

### Recommended: Dio interceptor for auto-refresh

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Call POST /auth/refresh
      // Retry original request with new token
    }
    handler.next(err);
  }
}
```

---

## Architecture

```
src/
├── config/              # ConfigService mapping
├── common/
│   ├── constants/       # Cache keys, queue names
│   ├── decorators/      # @CurrentUser, @Public, @Roles
│   ├── exceptions/      # Custom exception classes
│   ├── filters/         # Global HTTP exception filter
│   ├── interceptors/    # Response wrapper, logging
│   ├── pipes/           # ParseUuidPipe
│   └── types/           # JwtPayload, RequestUser, etc.
├── infrastructure/
│   ├── database/prisma/ # PrismaService
│   ├── cache/           # RedisService
│   ├── storage/         # S3Service
│   └── logging/         # Winston LoggingModule
├── modules/
│   ├── auth/
│   │   ├── domain/interfaces/     # IAuthRepository contract
│   │   ├── infrastructure/
│   │   │   ├── repositories/      # AuthRepository (Prisma)
│   │   │   └── services/          # PasswordService, TokenService, EmailService, GoogleAuthService, AppleAuthService, JwtStrategy
│   │   ├── application/
│   │   │   ├── dto/               # Request DTOs
│   │   │   └── use-cases/         # One use-case per auth flow
│   │   └── presentation/
│   │       ├── guards/            # JwtAuthGuard, RolesGuard
│   │       └── controllers/       # AuthController
│   └── user/
│       ├── domain/interfaces/     # IUserRepository contract
│       ├── infrastructure/
│       │   └── repositories/      # UserRepository (Prisma)
│       ├── application/
│       │   ├── dto/               # UpdateProfileDto, ChangePasswordDto
│       │   └── services/          # UserService
│       └── presentation/
│           └── controllers/       # UserController
└── health/              # Health check endpoint
```
