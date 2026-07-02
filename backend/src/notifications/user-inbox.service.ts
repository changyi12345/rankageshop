import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

export type InboxNotificationType = 'order' | 'wallet' | 'refund' | 'promo' | 'admin' | 'system';

export interface CreateInboxInput {
  type?: InboxNotificationType;
  title: string;
  body: string;
  url?: string;
  push?: boolean;
}

function mapRow(row: {
  id: number;
  type: string;
  title: string;
  body: string;
  url: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    url: row.url,
    read: row.readAt != null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class UserInboxService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  async notify(userId: number, input: CreateInboxInput) {
    const row = await this.prisma.userNotification.create({
      data: {
        userId,
        type: input.type ?? 'system',
        title: input.title.trim(),
        body: input.body.trim(),
        url: input.url?.trim() || null,
      },
    });

    if (input.push !== false) {
      await this.push.notifyUser(userId, {
        title: input.title,
        body: input.body,
        url: input.url,
      });
    }

    return mapRow(row);
  }

  async notifyMany(userIds: number[], input: CreateInboxInput) {
    const unique = [...new Set(userIds)];
    let sent = 0;
    for (const userId of unique) {
      await this.notify(userId, input);
      sent += 1;
    }
    return { sent };
  }

  async list(userId: number, opts?: { limit?: number; unreadOnly?: boolean }) {
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
    const rows = await this.prisma.userNotification.findMany({
      where: {
        userId,
        ...(opts?.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapRow);
  }

  async unreadCount(userId: number) {
    const count = await this.prisma.userNotification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: number, id: number) {
    const row = await this.prisma.userNotification.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    if (row.readAt) return mapRow(row);

    const updated = await this.prisma.userNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return mapRow(updated);
  }

  async markAllRead(userId: number) {
    const result = await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
