import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UserInboxService } from '../notifications/user-inbox.service';

const MAX_BODY = 2000;

function mapMessage(row: {
  id: number;
  conversationId: number;
  senderType: string;
  senderId: number | null;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderType: row.senderType,
    senderId: row.senderId,
    body: row.body,
    read: row.readAt != null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private userInbox: UserInboxService,
  ) {}

  private async assertLiveChatEnabled() {
    const flags = await this.settings.getFeatureFlags();
    if (!flags.liveChatEnabled) {
      throw new BadRequestException('Live chat is currently disabled');
    }
  }

  private validateBody(body: string) {
    const text = body?.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');
    if (text.length > MAX_BODY) {
      throw new BadRequestException(`Message must be at most ${MAX_BODY} characters`);
    }
    return text;
  }

  async getOrCreateConversation(userId: number) {
    await this.assertLiveChatEnabled();
    let conversation = await this.prisma.chatConversation.findFirst({
      where: { userId, status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: { userId, status: 'OPEN' },
      });
    }
    return conversation;
  }

  async getUserThread(userId: number) {
    await this.assertLiveChatEnabled();
    const conversation = await this.getOrCreateConversation(userId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: 'ADMIN',
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return {
      conversationId: conversation.id,
      status: conversation.status,
      messages: messages.map(mapMessage),
    };
  }

  async getUserMessages(userId: number, sinceId?: number) {
    await this.assertLiveChatEnabled();
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { userId, status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conversation) {
      return { conversationId: null, messages: [], unreadAdmin: 0 };
    }
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId: conversation.id,
        ...(sinceId ? { id: { gt: sinceId } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    if (messages.some((m) => m.senderType === 'ADMIN' && !m.readAt)) {
      await this.prisma.chatMessage.updateMany({
        where: {
          conversationId: conversation.id,
          senderType: 'ADMIN',
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    }
    const unreadAdmin = await this.prisma.chatMessage.count({
      where: {
        conversationId: conversation.id,
        senderType: 'ADMIN',
        readAt: null,
      },
    });
    return {
      conversationId: conversation.id,
      messages: messages.map(mapMessage),
      unreadAdmin,
    };
  }

  async sendUserMessage(userId: number, body: string) {
    await this.assertLiveChatEnabled();
    const text = this.validateBody(body);
    const conversation = await this.getOrCreateConversation(userId);
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'USER',
        senderId: userId,
        body: text,
      },
    });
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });
    return mapMessage(message);
  }

  async countUnreadForAdmin() {
    return this.prisma.chatMessage.count({
      where: { senderType: 'USER', readAt: null },
    });
  }

  async listConversations(status = 'OPEN') {
    await this.assertLiveChatEnabled();
    const where = status === 'all' ? {} : { status: status.toUpperCase() };
    const rows = await this.prisma.chatConversation.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
      include: {
        user: { select: { id: true, username: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    const unreadGroups = await this.prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: { senderType: 'USER', readAt: null },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      user: row.user,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      preview: row.messages[0]?.body ?? null,
      previewSender: row.messages[0]?.senderType ?? null,
      unread: unreadMap.get(row.id) ?? 0,
    }));
  }

  async getAdminMessages(conversationId: number, sinceId?: number) {
    await this.assertLiveChatEnabled();
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(sinceId ? { id: { gt: sinceId } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: sinceId ? 100 : 200,
    });
    if (!sinceId) {
      await this.prisma.chatMessage.updateMany({
        where: { conversationId, senderType: 'USER', readAt: null },
        data: { readAt: new Date() },
      });
    }
    return {
      conversation: {
        id: conversation.id,
        status: conversation.status,
        user: conversation.user,
        lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      },
      messages: messages.map(mapMessage),
    };
  }

  async sendAdminMessage(adminId: number, conversationId: number, body: string) {
    await this.assertLiveChatEnabled();
    const text = this.validateBody(body);
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: 'ADMIN',
        senderId: adminId,
        body: text,
      },
    });
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt, status: 'OPEN' },
    });
    const full = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (full) {
      await this.userInbox.notify(full.userId, {
        type: 'system',
        title: 'Support replied',
        body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
        url: '/help#contact-support',
        push: true,
      });
    }
    return mapMessage(message);
  }

  async closeConversation(conversationId: number) {
    await this.assertLiveChatEnabled();
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { status: 'CLOSED' },
    });
    return { id: conversationId, status: 'CLOSED' };
  }
}
