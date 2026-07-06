import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

export class SaveExploreImageDto {
  @IsString()
  @IsNotEmpty()
  picsum_id: string;

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