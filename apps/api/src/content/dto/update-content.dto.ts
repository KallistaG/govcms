import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ContentStatusEnum, ContentTypeEnum } from '@prisma/client';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsEnum(ContentTypeEnum)
  @IsOptional()
  type?: ContentTypeEnum;

  @IsEnum(ContentStatusEnum)
  @IsOptional()
  status?: ContentStatusEnum;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
