import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import { MenusModule } from './menus/menus.module';
import { PageBuilderModule } from './page-builder/page-builder.module';
import { ThemeModule } from './theme/theme.module';
import { UsersModule } from './users/users.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    ContentModule,
    MediaModule,
    MenusModule,
    PageBuilderModule,
    ThemeModule,
    UsersModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
