import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('home')
  getHomeContent() {
    return this.contentService.getHomeContent();
  }

  @Get('events')
  getEvents() {
    return this.contentService.getPublishedEvents();
  }

  @Get('events/:slug')
  getEvent(@Param('slug') slug: string) {
    return this.contentService.getEventBySlug(slug);
  }

  @Get('legal/:slug')
  getLegalPage(@Param('slug') slug: string, @Query('lang') lang?: string) {
    const locale = lang === 'mm' ? 'mm' : 'en';
    return this.contentService.getLegalPage(slug, locale);
  }
}
