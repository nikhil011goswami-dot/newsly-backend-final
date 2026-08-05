import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard }  from '@modules/auth/presentation/guards/jwt-auth.guard';
import { CurrentUser }   from '@common/decorators/current-user.decorator';
import { RequestUser }   from '@common/types';
import { ParseUuidPipe } from '@common/pipes/parse-uuid.pipe';

import { UserService }       from '../../application/services/user.service';
import { UpdateProfileDto }  from '../../application/dto/update-profile.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ── Profile ────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.userService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  // ── Password change ────────────────────────────────────────────────────────

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed; all sessions invalidated' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user.id, dto);
  }

  // ── Account ────────────────────────────────────────────────────────────────

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  deleteAccount(@CurrentUser() user: RequestUser) {
    return this.userService.deleteAccount(user.id);
  }

  // ── Device / session management ────────────────────────────────────────────

  @Get('me/sessions')
  @ApiOperation({ summary: 'List all active sessions / devices' })
  @ApiResponse({ status: 200, description: 'Active sessions returned' })
  getSessions(@CurrentUser() user: RequestUser) {
    return this.userService.getSessions(user.id);
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific device session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 403, description: 'Session does not belong to you' })
  revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId', ParseUuidPipe) sessionId: string,
  ) {
    return this.userService.revokeSession(sessionId, user.id);
  }
}
