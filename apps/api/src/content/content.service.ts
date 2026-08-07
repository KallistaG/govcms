import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { ContentStatusEnum, ContentTypeEnum } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findAll(query: QueryContentDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: query.includeDeleted ? undefined : false,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.contentItem.count({ where }),
      this.prisma.contentItem.findMany({
        where,
        take: limit,
        skip,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          agency: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: items.map((item) => ({
        ...item,
        authorName: `${item.author.firstName} ${item.author.lastName}`,
        agencyName: item.agency.name,
      })),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        agency: { select: { id: true, name: true, code: true } },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException(`Content item with ID "${id}" not found`);
    }

    return {
      ...item,
      authorName: `${item.author.firstName} ${item.author.lastName}`,
      agencyName: item.agency.name,
    };
  }

  async create(dto: CreateContentDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true },
    });

    if (!user || !user.agencyId) {
      throw new BadRequestException('User must belong to a registered government agency to publish content');
    }

    const baseSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const status = dto.status || ContentStatusEnum.DRAFT;
    const publishedAt = status === ContentStatusEnum.PUBLISHED ? new Date() : null;

    const item = await this.prisma.contentItem.create({
      data: {
        title: dto.title,
        slug: uniqueSlug,
        summary: dto.summary,
        body: dto.body,
        type: dto.type,
        status,
        featuredImage: dto.featuredImage,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
        location: dto.location,
        publishedAt,
        authorId: user.id,
        agencyId: user.agencyId,
      },
      include: { author: true, agency: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CONTENT',
        entityType: 'ContentItem',
        entityId: item.id,
        metadata: { title: item.title, type: item.type, status: item.status },
      },
    });

    return item;
  }

  async update(id: string, dto: UpdateContentDto, userId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item || item.isDeleted) {
      throw new NotFoundException(`Content item with ID "${id}" not found`);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.featuredImage !== undefined) data.featuredImage = dto.featuredImage;
    if (dto.eventDate !== undefined) data.eventDate = dto.eventDate ? new Date(dto.eventDate) : null;
    if (dto.location !== undefined) data.location = dto.location;

    if (dto.slug) {
      data.slug = `${this.slugify(dto.slug)}-${Date.now().toString(36)}`;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === ContentStatusEnum.PUBLISHED && !item.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CONTENT',
        entityType: 'ContentItem',
        entityId: id,
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  }

  async softDelete(id: string, userId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item || item.isDeleted) {
      throw new NotFoundException(`Content item with ID "${id}" not found`);
    }

    await this.prisma.contentItem.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SOFT_DELETE_CONTENT',
        entityType: 'ContentItem',
        entityId: id,
      },
    });

    return { message: 'Content item soft-deleted successfully' };
  }

  async bulkDelete(dto: BulkActionDto, userId: string) {
    const result = await this.prisma.contentItem.updateMany({
      where: { id: { in: dto.ids }, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_DELETE_CONTENT',
        entityType: 'ContentItem',
        metadata: { count: result.count, ids: dto.ids },
      },
    });

    return { message: `Successfully soft-deleted ${result.count} item(s)` };
  }

  async bulkPublish(dto: BulkActionDto, userId: string) {
    const result = await this.prisma.contentItem.updateMany({
      where: { id: { in: dto.ids }, isDeleted: false },
      data: {
        status: ContentStatusEnum.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_PUBLISH_CONTENT',
        entityType: 'ContentItem',
        metadata: { count: result.count, ids: dto.ids },
      },
    });

    return { message: `Successfully published ${result.count} item(s)` };
  }

  async bulkArchive(dto: BulkActionDto, userId: string) {
    const result = await this.prisma.contentItem.updateMany({
      where: { id: { in: dto.ids }, isDeleted: false },
      data: {
        status: ContentStatusEnum.ARCHIVED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_ARCHIVE_CONTENT',
        entityType: 'ContentItem',
        metadata: { count: result.count, ids: dto.ids },
      },
    });

    return { message: `Successfully archived ${result.count} item(s)` };
  }
}
