import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HomepageSection {
  id: string;
  type: 'hero' | 'carousel' | 'news' | 'cards' | 'gallery' | 'statistics' | 'contact' | 'map' | 'footer';
  title: string;
  order: number;
  isVisible: boolean;
  config: Record<string, any>;
}

export interface PageBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'gallery' | 'cards' | 'accordion' | 'quote' | 'divider' | 'video' | 'pdf' | 'button' | 'download' | 'map' | 'table' | 'columns' | 'hero';
  order: number;
  collapsed: boolean;
  config: Record<string, any>;
}

@Injectable()
export class PageBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateAgencyId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.agencyId) return user.agencyId;

    const firstAgency = await this.prisma.agency.findFirst();
    if (firstAgency) return firstAgency.id;

    const newAgency = await this.prisma.agency.create({
      data: {
        name: 'Department of Information and Communications Technology',
        code: 'DICT',
        slug: 'dict',
      },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { agencyId: newAgency.id },
      });
    }

    return newAgency.id;
  }

  // ─── Homepage Section Builder ───────────────────────────────────────

  async getHomepage(userId: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);
    return this.prisma.homepageConfig.findFirst({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicHomepage() {
    let config = await this.prisma.homepageConfig.findFirst({
      where: { isDraft: false },
      orderBy: { publishedAt: 'desc' },
    });

    if (!config) {
      config = await this.prisma.homepageConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!config) return { sections: [] };

    const sections = (config.sections as unknown as HomepageSection[]) || [];
    return {
      id: config.id,
      name: config.name,
      sections: sections.filter((s) => s.isVisible).sort((a, b) => a.order - b.order),
    };
  }

  async saveHomepageSections(sections: HomepageSection[], userId: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);

    const existing = await this.prisma.homepageConfig.findFirst({
      where: { agencyId },
    });

    if (existing) {
      return this.prisma.homepageConfig.update({
        where: { id: existing.id },
        data: {
          sections: sections as any,
          isDraft: false, // Instant publish for public site visibility
          publishedAt: new Date(),
        },
      });
    }

    return this.prisma.homepageConfig.create({
      data: {
        name: 'Default Homepage',
        slug: `homepage-${Date.now().toString(36)}`,
        sections: sections as any,
        isDraft: false,
        publishedAt: new Date(),
        agencyId,
        authorId: userId,
      },
    });
  }

  async publishHomepage(userId: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);

    const config = await this.prisma.homepageConfig.findFirst({
      where: { agencyId },
    });

    if (!config) throw new NotFoundException('No homepage configuration found');

    return this.prisma.homepageConfig.update({
      where: { id: config.id },
      data: {
        isDraft: false,
        publishedAt: new Date(),
      },
    });
  }

  // ─── Notion Block Page Builder ──────────────────────────────────────

  async getPageBlocks(slug: string, userId: string) {
    return this.prisma.pageBlockConfig.findUnique({
      where: { slug },
    });
  }

  async getAllPages(userId: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);
    return this.prisma.pageBlockConfig.findMany({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicPage(slug: string) {
    const page = await this.prisma.pageBlockConfig.findUnique({
      where: { slug },
    });

    if (!page) return null;

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      blocks: ((page.blocks as unknown as PageBlock[]) || []).sort((a, b) => a.order - b.order),
    };
  }

  async savePageBlocks(slug: string, title: string, blocks: PageBlock[], userId: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);

    const existing = await this.prisma.pageBlockConfig.findUnique({
      where: { slug },
    });

    if (existing) {
      return this.prisma.pageBlockConfig.update({
        where: { id: existing.id },
        data: {
          title,
          blocks: blocks as any,
          isDraft: false, // Instant publish for public site visibility
          publishedAt: new Date(),
        },
      });
    }

    return this.prisma.pageBlockConfig.create({
      data: {
        title,
        slug,
        blocks: blocks as any,
        isDraft: false,
        publishedAt: new Date(),
        agencyId,
        authorId: userId,
      },
    });
  }

  async publishPage(slug: string, userId: string) {
    const page = await this.prisma.pageBlockConfig.findUnique({
      where: { slug },
    });

    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.pageBlockConfig.update({
      where: { id: page.id },
      data: {
        isDraft: false,
        publishedAt: new Date(),
      },
    });
  }

  async deletePage(slug: string) {
    const page = await this.prisma.pageBlockConfig.findUnique({
      where: { slug },
    });

    if (!page) throw new NotFoundException('Page not found');

    await this.prisma.pageBlockConfig.delete({ where: { id: page.id } });
    return { message: 'Page deleted successfully' };
  }
}
