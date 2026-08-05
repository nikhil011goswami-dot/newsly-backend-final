import { Module } from '@nestjs/common';

import { PrismaModule }  from '@infrastructure/database/prisma/prisma.module';
import { AuthModule }    from '@modules/auth/auth.module';

import { UserRepository }  from './infrastructure/repositories/user.repository';
import { UserService }     from './application/services/user.service';
import { UserController }  from './presentation/controllers/user.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,   // exposes JwtAuthGuard, PasswordService, AuthRepository
  ],
  controllers: [UserController],
  providers:   [UserRepository, UserService],
  exports:     [UserService],
})
export class UserModule {}
