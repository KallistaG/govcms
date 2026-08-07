import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import { MenusModule } from './menus/menus.module';
import { PageBuilderModule } from './page-builder/page-builder.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    ContentModule,
    MediaModule,
    MenusModule,
    PageBuilderModule,
  ],
})
export class AppModule {}
