import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MenuLocationEnum } from '@prisma/client';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty({ message: 'Menu name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(MenuLocationEnum, { message: 'Must be a valid menu location' })
  @IsOptional()
  location?: MenuLocationEnum;
}
