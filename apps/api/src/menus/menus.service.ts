import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuItemsDto } from './dto/reorder-items.dto';
import { MenuLocationEnum } from '@prisma/client';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  private buildTree(items: any[], parentId: string | null = null): any[] {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }

  async findAllMenus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.agencyId) return [];

    return this.prisma.menu.findMany({
      where: { agencyId: user.agencyId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicMenuByLocation(location: MenuLocationEnum) {
    const menu = await this.prisma.menu.findFirst({
      where: { location },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) {
      return { location, items: [] };
    }

    const tree = this.buildTree(menu.items, null);
    return {
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: tree,
    };
  }

  async findOneMenu(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) throw new NotFoundException(`Menu with ID "${id}" not found`);

    const tree = this.buildTree(menu.items, null);
    return {
      ...menu,
      tree,
    };
  }

  async createMenu(dto: CreateMenuDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.agencyId) {
      throw new BadRequestException('User must belong to an agency to create menus');
    }

    const code = dto.code || `${dto.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    const menu = await this.prisma.menu.create({
      data: {
        name: dto.name,
        code,
        location: dto.location || MenuLocationEnum.HEADER_MENU,
        agencyId: user.agencyId,
        createdById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_MENU',
        entityType: 'Menu',
        entityId: menu.id,
        metadata: { name: menu.name, location: menu.location },
      },
    });

    return menu;
  }

  async deleteMenu(id: string, userId: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) throw new NotFoundException('Menu not found');

    await this.prisma.menu.delete({ where: { id } });
    return { message: 'Menu deleted successfully' };
  }

  async createMenuItem(dto: CreateMenuItemDto, userId: string) {
    const item = await this.prisma.menuItem.create({
      data: {
        menuId: dto.menuId,
        parentId: dto.parentId || null,
        title: dto.title,
        url: dto.url,
        icon: dto.icon || 'Link',
        isExternal: dto.isExternal || dto.url.startsWith('http'),
        openInNewTab: dto.openInNewTab || false,
        isVisible: dto.isVisible ?? true,
        order: dto.order || 0,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_MENU_ITEM',
        entityType: 'MenuItem',
        entityId: item.id,
        metadata: { title: item.title, url: item.url },
      },
    });

    return item;
  }

  async updateMenuItem(id: string, dto: Partial<CreateMenuItemDto>, userId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : item.title,
        url: dto.url !== undefined ? dto.url : item.url,
        icon: dto.icon !== undefined ? dto.icon : item.icon,
        isExternal: dto.isExternal !== undefined ? dto.isExternal : item.isExternal,
        openInNewTab: dto.openInNewTab !== undefined ? dto.openInNewTab : item.openInNewTab,
        isVisible: dto.isVisible !== undefined ? dto.isVisible : item.isVisible,
        parentId: dto.parentId !== undefined ? dto.parentId : item.parentId,
        order: dto.order !== undefined ? dto.order : item.order,
      },
    });
  }

  async deleteMenuItem(id: string, userId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');

    await this.prisma.menuItem.delete({ where: { id } });
    return { message: 'Menu item deleted successfully' };
  }

  async reorderItems(dto: ReorderMenuItemsDto, userId: string) {
    await this.prisma.$transaction(
      dto.items.map((element) =>
        this.prisma.menuItem.update({
          where: { id: element.id },
          data: {
            parentId: element.parentId || null,
            order: element.order,
          },
        }),
      ),
    );

    return { message: 'Menu tree reordered successfully' };
  }
}
