import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger    = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get<string>('app.nodeEnv') === 'development';

    if (!this.isDev) {
      this.transporter = nodemailer.createTransport({
        host:   this.configService.get<string>('email.host', 'smtp.gmail.com'),
        port:   this.configService.get<number>('email.port', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('email.user'),
          pass: this.configService.get<string>('email.password'),
        },
      });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get('app.frontendUrl', 'http://localhost:3000')}/auth/verify-email?token=${token}`;

    if (this.isDev) {
      this.logger.warn(`[DEV] Verification link for ${email}: ${verifyUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from:    `"Newsly" <${this.configService.get('email.from')}>`,
      to:      email,
      subject: 'Verify your Newsly email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a73e8;">Welcome to Newsly! 📰</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verifyUrl}"
             style="background:#1a73e8;color:white;padding:12px 24px;text-decoration:none;
                    border-radius:6px;display:inline-block;margin:16px 0;">
            Verify Email
          </a>
          <p>This link expires in <strong>24 hours</strong>.</p>
          <p>If you did not create a Newsly account, you can safely ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('app.frontendUrl', 'http://localhost:3000')}/auth/reset-password?token=${token}`;

    if (this.isDev) {
      this.logger.warn(`[DEV] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from:    `"Newsly" <${this.configService.get('email.from')}>`,
      to:      email,
      subject: 'Reset your Newsly password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a73e8;">Password Reset</h2>
          <p>We received a request to reset your Newsly password. Click below to choose a new one:</p>
          <a href="${resetUrl}"
             style="background:#e53935;color:white;padding:12px 24px;text-decoration:none;
                    border-radius:6px;display:inline-block;margin:16px 0;">
            Reset Password
          </a>
          <p>This link expires in <strong>1 hour</strong>.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
