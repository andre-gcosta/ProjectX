import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { Prisma } from '@prisma/client';

@Controller('entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  /**
   * Cria uma nova entidade (com capabilities opcionais)
   */
  @Post()
  async create(@Body() dto: CreateEntityDto) {
    // Agora o próprio service já trata capabilities internas
    return this.entityService.create(dto);
  }

  /**
   * Retorna todas as entidades (com filtros opcionais)
   * Exemplo: /entities?type=task&search=meta
   */
  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.entityService.findAllFiltered(type, search);
  }

  /**
   * Retorna uma entidade pelo ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.entityService.findOne(id);
  }

  /**
   * Atualiza uma entidade
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEntityDto) {
    return this.entityService.update(id, dto);
  }

  /**
   * Remove uma entidade
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.entityService.remove(id);
  }

  /**
   * Adiciona uma capability a uma entidade existente
   */
  @Post(':id/capabilities')
  async addCapability(
    @Param('id') id: string,
    @Body() capabilityData: Prisma.CapabilityCreateWithoutEntityInput,
  ) {
    return this.entityService.addCapability(id, capabilityData);
  }

  /**
   * Cria um link entre duas entidades
   */
  @Post(':id/link')
  async linkEntities(
    @Param('id') sourceId: string,
    @Body() body: { targetId: string; type: string },
  ) {
    return this.entityService.linkEntities(sourceId, body.targetId, body.type);
  }
}
