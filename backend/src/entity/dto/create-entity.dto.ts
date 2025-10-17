import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO auxiliar para criação de capabilities
class CreateCapabilityDto {
  @IsString()
  type: string;

  @IsObject()
  data: Record<string, any>;
}

// DTO auxiliar para criação de links (futuro opcional)
class CreateLinkDto {
  @IsString()
  targetId: string;

  @IsString()
  type: string;
}

export class CreateEntityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  // Novo: capabilities
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCapabilityDto)
  capabilities?: CreateCapabilityDto[];

  // Novo (futuro): links
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLinkDto)
  links?: CreateLinkDto[];
}
