import { IsString, IsOptional, IsObject } from 'class-validator';
import { Prisma } from '@prisma/client';

export class CreateCapabilityDto {
  @IsString()
  type: string;

  // Prisma espera JsonValue
  @IsOptional()
  data?: Prisma.JsonValue;

  @IsString()
  entityId: string;
}
