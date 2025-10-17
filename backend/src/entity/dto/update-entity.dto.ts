import { CreateEntityDto } from './create-entity.dto';

/**
 * DTO para atualização de entidade.
 * Todos os campos são opcionais.
 */
export class UpdateEntityDto implements Partial<CreateEntityDto> {
  title?: string;
  content?: string;
  priority?: number;
  userId?: string;
  capabilities?: any[]; // caso queira manter capabilities inline
}
