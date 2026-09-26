import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';

import { NotificationController } from './presentation/controllers/notification.controller';
import { NotificationService } from './application/services/notification.service';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
  ],
  exports: [
    NotificationService,
    NotificationRepository,
  ],
})
export class NotificationModule {}
