import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'At least one content item ID must be provided' })
  ids!: string[];
}
