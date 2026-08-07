import { Module } from '@nestjs/common';
import { PageBuilderService } from './page-builder.service';
import { PageBuilderController } from './page-builder.controller';

@Module({
  controllers: [PageBuilderController],
  providers: [PageBuilderService],
  exports: [PageBuilderService],
})
export class PageBuilderModule {}
