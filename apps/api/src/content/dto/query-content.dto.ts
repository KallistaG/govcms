import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ContentStatusEnum, ContentTypeEnum } from '@prisma/client';

export class QueryContentDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ContentTypeEnum)
  @IsOptional()
  type?: ContentTypeEnum;

  @IsEnum(ContentStatusEnum)
  @IsOptional()
  status?: ContentStatusEnum;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean = false;
}
