import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const ANNOUNCEMENT_IMAGE_PLACEHOLDER = '__announcement__';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `event-${Date.now()}`;
}

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  private isBannerLive(banner: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  }) {
    if (!banner.isActive) return false;
    const now = new Date();
    if (banner.startsAt && banner.startsAt > now) return false;
    if (banner.endsAt && banner.endsAt < now) return false;
    return true;
  }

  async getAnnouncements() {
    const banners = await this.prisma.shopBanner.findMany({
      where: { position: 'announcement' },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    });
    return banners
      .filter((b) => this.isBannerLive(b))
      .map((b) => ({
        id: b.id,
        message: b.title,
        link_url: b.linkUrl ?? '',
      }));
  }

  async getHomeContent() {
    const [banners, events] = await Promise.all([
      this.prisma.shopBanner.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }),
      this.prisma.shopEvent.findMany({
        where: { isPublished: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
      }),
    ]);

    const settings = await this.settings.getShopSettings();

    return {
      shopName: settings.shopName,
      shopTagline: settings.shopTagline,
      logoUrl: settings.logoUrl,
      heroBanners: banners
        .filter((b) => b.position === 'home_hero' && this.isBannerLive(b))
        .map(this.mapBanner),
      midBanners: banners
        .filter((b) => b.position === 'home_mid' && this.isBannerLive(b))
        .map(this.mapBanner),
      events: events.map(this.mapEvent),
    };
  }

  async getPublishedEvents() {
    await this.settings.assertFeatureEnabled('eventsEnabled');
    const events = await this.prisma.shopEvent.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
    return events.map(this.mapEvent);
  }

  async getEventBySlug(slug: string) {
    await this.settings.assertFeatureEnabled('eventsEnabled');
    const event = await this.prisma.shopEvent.findFirst({
      where: { slug, isPublished: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.mapEvent(event);
  }

  async getAllBanners() {
    const rows = await this.prisma.shopBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    });
    return rows.map(this.mapBanner);
  }

  async getAllEvents() {
    const rows = await this.prisma.shopEvent.findMany({
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
    return rows.map(this.mapEvent);
  }

  async createBanner(data: {
    title: string;
    imageUrl?: string;
    linkUrl?: string | null;
    position?: string;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  }) {
    const position = data.position ?? 'home_hero';
    const isAnnouncement = position === 'announcement';
    if (!data.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    if (!isAnnouncement && !data.imageUrl?.trim()) {
      throw new BadRequestException('Title and image are required');
    }
    const imageUrl = isAnnouncement
      ? data.imageUrl?.trim() || ANNOUNCEMENT_IMAGE_PLACEHOLDER
      : data.imageUrl!.trim();
    const row = await this.prisma.shopBanner.create({
      data: {
        title: data.title.trim(),
        imageUrl,
        linkUrl: data.linkUrl?.trim() || null,
        position,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    });
    return this.mapBanner(row);
  }

  async updateBanner(
    id: number,
    data: Partial<{
      title: string;
      imageUrl: string;
      linkUrl: string | null;
      position: string;
      sortOrder: number;
      isActive: boolean;
      startsAt: string | null;
      endsAt: string | null;
    }>,
  ) {
    await this.ensureBanner(id);
    const row = await this.prisma.shopBanner.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title.trim() } : {}),
        ...(data.imageUrl != null ? { imageUrl: data.imageUrl.trim() } : {}),
        ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl?.trim() || null } : {}),
        ...(data.position != null ? { position: data.position } : {}),
        ...(data.sortOrder != null ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      },
    });
    return this.mapBanner(row);
  }

  async deleteBanner(id: number) {
    await this.ensureBanner(id);
    await this.prisma.shopBanner.delete({ where: { id } });
    return { message: 'Banner deleted' };
  }

  async createEvent(data: {
    title: string;
    slug?: string;
    excerpt?: string | null;
    content: string;
    imageUrl?: string | null;
    isPublished?: boolean;
    isPinned?: boolean;
    publishedAt?: string;
  }) {
    if (!data.title?.trim() || !data.content?.trim()) {
      throw new BadRequestException('Title and content are required');
    }
    let slug = slugify(data.slug?.trim() || data.title);
    let suffix = 1;
    while (await this.prisma.shopEvent.findUnique({ where: { slug } })) {
      slug = `${slugify(data.title)}-${suffix++}`;
    }
    const row = await this.prisma.shopEvent.create({
      data: {
        title: data.title.trim(),
        slug,
        excerpt: data.excerpt?.trim() || null,
        content: data.content.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        isPublished: data.isPublished ?? true,
        isPinned: data.isPinned ?? false,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      },
    });
    return this.mapEvent(row);
  }

  async updateEvent(
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      imageUrl: string | null;
      isPublished: boolean;
      isPinned: boolean;
      publishedAt: string;
    }>,
  ) {
    await this.ensureEvent(id);
    if (data.slug) {
      const taken = await this.prisma.shopEvent.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (taken) throw new BadRequestException('Slug already in use');
    }
    const row = await this.prisma.shopEvent.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title.trim() } : {}),
        ...(data.slug != null ? { slug: slugify(data.slug) } : {}),
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt?.trim() || null } : {}),
        ...(data.content != null ? { content: data.content.trim() } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() || null } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
        ...(data.publishedAt != null ? { publishedAt: new Date(data.publishedAt) } : {}),
      },
    });
    return this.mapEvent(row);
  }

  async deleteEvent(id: number) {
    await this.ensureEvent(id);
    await this.prisma.shopEvent.delete({ where: { id } });
    return { message: 'Event deleted' };
  }

  async updateBranding(data: { logoUrl?: string | null; faviconUrl?: string | null }) {
    return this.settings.updateShopSettings({
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
    });
  }

  async getLegalPage(slug: string, lang: 'en' | 'mm' = 'en') {
    const row = await this.prisma.legalPage.findUnique({ where: { slug } });
    if (!row) {
      return {
        slug,
        sections: [] as { title: string; body: string }[],
        updatedAt: null,
        lang,
      };
    }
    const sectionsEn = (row.sections as { title: string; body: string }[]) ?? [];
    const sectionsMm = (row.sectionsMm as { title: string; body: string }[]) ?? [];
    const useMm = lang === 'mm' && sectionsMm.length > 0;
    return {
      slug: row.slug,
      sections: useMm ? sectionsMm : sectionsEn,
      sectionsEn,
      sectionsMm,
      updatedAt: row.updatedAt.toISOString(),
      lang: useMm ? 'mm' : 'en',
    };
  }

  async updateLegalPage(
    slug: string,
    data: {
      sections?: { title: string; body: string }[];
      sectionsEn?: { title: string; body: string }[];
      sectionsMm?: { title: string; body: string }[];
      locale?: 'en' | 'mm';
    },
  ) {
    const locale = data.locale;
    const sectionsEn = data.sectionsEn ?? (locale === 'en' || !locale ? data.sections : undefined);
    const sectionsMm = data.sectionsMm ?? (locale === 'mm' ? data.sections : undefined);

    if (!sectionsEn?.length && !sectionsMm?.length) {
      throw new BadRequestException('At least one section is required');
    }

    const existing = await this.prisma.legalPage.findUnique({ where: { slug } });
    const row = await this.prisma.legalPage.upsert({
      where: { slug },
      update: {
        ...(sectionsEn?.length ? { sections: sectionsEn } : {}),
        ...(sectionsMm !== undefined ? { sectionsMm: sectionsMm ?? [] } : {}),
      },
      create: {
        slug,
        sections: sectionsEn?.length ? sectionsEn : sectionsMm ?? [],
        sectionsMm: sectionsMm ?? [],
      },
    });

    if (!existing && !sectionsEn?.length && sectionsMm?.length) {
      await this.prisma.legalPage.update({
        where: { slug },
        data: { sections: [] },
      });
    }

    return this.getLegalPage(slug);
  }

  private async ensureBanner(id: number) {
    const row = await this.prisma.shopBanner.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Banner not found');
    return row;
  }

  private async ensureEvent(id: number) {
    const row = await this.prisma.shopEvent.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Event not found');
    return row;
  }

  private mapBanner = (b: {
    id: number;
    title: string;
    imageUrl: string;
    linkUrl: string | null;
    position: string;
    sortOrder: number;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    position: b.position,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    startsAt: b.startsAt?.toISOString() ?? null,
    endsAt: b.endsAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  });

  private mapEvent = (e: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    imageUrl: string | null;
    isPublished: boolean;
    isPinned: boolean;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    excerpt: e.excerpt,
    content: e.content,
    imageUrl: e.imageUrl,
    isPublished: e.isPublished,
    isPinned: e.isPinned,
    publishedAt: e.publishedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  });
}
