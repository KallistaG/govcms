import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleEnum } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEnum(RoleEnum, { message: 'Must be a valid GovCMS user role' })
  @IsOptional()
  role?: RoleEnum;

  @IsString()
  @IsOptional()
  agencyId?: string;
}
