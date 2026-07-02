import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserInboxService } from './user-inbox.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class UserNotificationsController {
  constructor(private inbox: UserInboxService) {}

  @Get()
  list(
    @Request() req: { user: { id: number } },
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.inbox.list(req.user.id, {
      limit: limit ? +limit : undefined,
      unreadOnly: unreadOnly === '1' || unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  unreadCount(@Request() req: { user: { id: number } }) {
    return this.inbox.unreadCount(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Request() req: { user: { id: number } }, @Param('id') id: string) {
    return this.inbox.markRead(req.user.id, +id);
  }

  @Post('read-all')
  markAllRead(@Request() req: { user: { id: number } }) {
    return this.inbox.markAllRead(req.user.id);
  }
}
