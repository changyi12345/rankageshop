import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UserInboxService } from './user-inbox.service';
import { UserNotificationsController } from './user-notifications.controller';
import { SettingsModule } from '../settings/settings.module';
import { PushModule } from '../push/push.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule, SettingsModule, PushModule],
  providers: [NotificationsService, UserInboxService],
  controllers: [UserNotificationsController],
  exports: [NotificationsService, UserInboxService],
})
export class NotificationsModule {}
