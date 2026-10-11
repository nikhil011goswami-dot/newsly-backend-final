import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request = require('supertest');

import { AuthController } from './auth.controller';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { GoogleAuthUseCase } from '../../application/use-cases/google-auth.use-case';
import { AppleAuthUseCase } from '../../application/use-cases/apple-auth.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';

describe('AuthController HTTP integration', () => {
  let app: INestApplication;

  const loginUseCase = { execute: jest.fn() };
  const registerUseCase = { execute: jest.fn() };
  const verifyEmailUseCase = { execute: jest.fn() };
  const googleAuthUseCase = { execute: jest.fn() };
  const appleAuthUseCase = { execute: jest.fn() };
  const refreshTokenUseCase = { execute: jest.fn() };
  const forgotPasswordUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const logoutUseCase = {
    executeCurrentDevice: jest.fn(),
    executeAllDevices: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RegisterUseCase, useValue: registerUseCase },
        { provide: VerifyEmailUseCase, useValue: verifyEmailUseCase },
        { provide: GoogleAuthUseCase, useValue: googleAuthUseCase },
        { provide: AppleAuthUseCase, useValue: appleAuthUseCase },
        { provide: RefreshTokenUseCase, useValue: refreshTokenUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject an invalid email before invoking the login use case', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'Password@123' })
      .expect(400);

    expect(loginUseCase.execute).not.toHaveBeenCalled();
  });

  it('should reject a request missing the password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com' })
      .expect(400);

    expect(loginUseCase.execute).not.toHaveBeenCalled();
  });

  it('should reject unknown fields in the login request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password@123',
        unexpectedField: true,
      })
      .expect(400);

    expect(loginUseCase.execute).not.toHaveBeenCalled();
  });

  it('should pass a valid login request to the use case', async () => {
    loginUseCase.execute.mockResolvedValue({ message: 'login handled' });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('user-agent', 'Newsly-Integration-Test')
      .send({ email: 'user@example.com', password: 'Password@123' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ message: 'login handled' });
      });

    expect(loginUseCase.execute).toHaveBeenCalledWith(
      { email: 'user@example.com', password: 'Password@123' },
      expect.any(String),
      'Newsly-Integration-Test',
    );
  });

  it('should reject registration with an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        fullName: 'Test User',
        password: 'Strong@123',
      })
      .expect(400);

    expect(registerUseCase.execute).not.toHaveBeenCalled();
  });

  it('should reject registration with a weak password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        fullName: 'Test User',
        password: 'weakpass',
      })
      .expect(400);

    expect(registerUseCase.execute).not.toHaveBeenCalled();
  });

  it('should reject unknown fields in a registration request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        fullName: 'Test User',
        password: 'Strong@123',
        unexpectedField: true,
      })
      .expect(400);

    expect(registerUseCase.execute).not.toHaveBeenCalled();
  });

  it('should pass a valid registration request to the use case', async () => {
    registerUseCase.execute.mockResolvedValue({ message: 'registration handled' });

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        fullName: 'Test User',
        password: 'Strong@123',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ message: 'registration handled' });
      });

    expect(registerUseCase.execute).toHaveBeenCalledWith({
      email: 'user@example.com',
      fullName: 'Test User',
      password: 'Strong@123',
    });
  });


  it('should reject forgot-password requests with an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(forgotPasswordUseCase.execute).not.toHaveBeenCalled();
  });

  it('should reject unknown fields in a forgot-password request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'user@example.com',
        unexpectedField: true,
      })
      .expect(400);

    expect(forgotPasswordUseCase.execute).not.toHaveBeenCalled();
  });

  it('should pass a valid email to the forgot-password use case', async () => {
    forgotPasswordUseCase.execute.mockResolvedValue({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'user@example.com' })
      .expect(200);

    expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith(
      'user@example.com',
    );
  });

});
