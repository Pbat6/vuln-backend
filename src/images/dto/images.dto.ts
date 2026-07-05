import { IsOptional, IsString } from 'class-validator';

export class SearchImageDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class UploadImageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class EditImageDto {
  @IsString()
  width: string;

  @IsString()
  height: string;

  @IsOptional()
  @IsString()
  format?: string;
}