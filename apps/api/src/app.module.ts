import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';
import { MenusModule } from './menus/menus.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    ContentModule,
    MediaModule,
    MenusModule,
  ],
})
export class AppModule {}
