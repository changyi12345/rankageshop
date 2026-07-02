import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get()
  getThread(@Request() req: { user: { id: number } }) {
    return this.chat.getUserThread(req.user.id);
  }

  @Get('messages')
  pollMessages(
    @Request() req: { user: { id: number } },
    @Query('since') since?: string,
  ) {
    const sinceId = since ? +since : undefined;
    return this.chat.getUserMessages(req.user.id, sinceId);
  }

  @Post('messages')
  sendMessage(
    @Request() req: { user: { id: number } },
    @Body('body') body: string,
  ) {
    return this.chat.sendUserMessage(req.user.id, body);
  }
}
