import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [PrismaModule, AuthModule, DashboardModule, ContentModule],
})
export class AppModule {}
