import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private contentService: ContentService) {}

  @Get()
  listAnnouncements() {
    return this.contentService.getAnnouncements();
  }
}
