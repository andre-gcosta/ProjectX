import { CreateCapabilityDto } from './create-capability.dto';
import { IsOptional, IsObject, IsString } from 'class-validator';

/**
 * DTO para atualização de capability.
 * Todos os campos são opcionais.
 */
export class UpdateCapabilityDto implements Partial<CreateCapabilityDto> {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  entityId?: string;
}
