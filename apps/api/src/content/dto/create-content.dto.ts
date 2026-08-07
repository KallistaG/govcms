import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ContentStatusEnum, ContentTypeEnum } from '@prisma/client';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsNotEmpty({ message: 'Body content is required' })
  body!: string;

  @IsEnum(ContentTypeEnum, { message: 'Must be a valid content type' })
  @IsNotEmpty()
  type!: ContentTypeEnum;

  @IsEnum(ContentStatusEnum, { message: 'Must be a valid content status' })
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
