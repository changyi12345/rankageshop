import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { AnnouncementsController } from './announcements.controller';
import { ContentService } from './content.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [ContentController, AnnouncementsController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
