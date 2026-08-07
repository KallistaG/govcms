import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MenuItemOrderElement {
  @IsString()
  id!: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsInt()
  order!: number;
}

export class ReorderMenuItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemOrderElement)
  items!: MenuItemOrderElement[];
}
