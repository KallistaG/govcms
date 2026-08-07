import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContentModule } from './content/content.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [PrismaModule, AuthModule, DashboardModule, ContentModule, MediaModule],
})
export class AppModule {}
