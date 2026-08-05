import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository }   from '../../infrastructure/repositories/user.repository';
import { PasswordService }  from '@modules/auth/infrastructure/services/password.service';
import { AuthRepository }   from '@modules/auth/infrastructure/repositories/auth.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Provider, UserSession } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository:    UserRepository,
    private readonly authRepository:    AuthRepository,
    private readonly passwordService:   PasswordService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    // Check username uniqueness if being changed
    if (dto.username) {
      const existing = await this.userRepository.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    const updated = await this.userRepository.update(userId, dto);
    this.logger.log(`Profile updated for user ${userId}`);
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const authProvider = await this.authRepository.findAuthProvider(userId, Provider.EMAIL);
    if (!authProvider || !authProvider.passwordHash) {
      throw new UnauthorizedException(
        'This account uses social sign-in and does not have a password.',
      );
    }

    const isCurrentValid = await this.passwordService.verify(
      authProvider.passwordHash,
      dto.currentPassword,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.authRepository.updateAuthProviderPassword(userId, newHash);

    // Invalidate all other sessions after a password change for security
    await this.authRepository.deactivateAllUserSessions(userId);

    this.logger.log(`Password changed for user ${userId}`);
    return { message: 'Password changed successfully. Please log in again on all your devices.' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    await this.userRepository.softDelete(userId);
    this.logger.log(`Account soft-deleted for user ${userId}`);
    return { message: 'Your account has been deleted.' };
  }

  async getSessions(userId: string): Promise<UserSession[]> {
    return this.userRepository.findActiveSessions(userId);
  }

  async revokeSession(sessionId: string, userId: string): Promise<{ message: string }> {
    await this.userRepository.revokeSession(sessionId, userId);
    this.logger.log(`Session ${sessionId} revoked by user ${userId}`);
    return { message: 'Device session revoked successfully.' };
  }
}
