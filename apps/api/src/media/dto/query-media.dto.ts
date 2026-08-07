import { IsOptional, IsString } from 'class-validator';

export class QueryMediaDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;
}
