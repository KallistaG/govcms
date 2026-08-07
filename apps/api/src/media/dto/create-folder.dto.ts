import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty({ message: 'Folder name is required' })
  @MinLength(2, { message: 'Folder name must be at least 2 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
