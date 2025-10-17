import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
} from '@nestjs/common';
import { CapabilityService } from './capability.service';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';
import { Prisma } from '@prisma/client';

@Controller('capabilities')
export class CapabilityController {
  private readonly logger = new Logger(CapabilityController.name);

  constructor(private readonly capabilityService: CapabilityService) {}

  /**
   * 🧩 Cria uma nova capability
   */
  @Post()
  async create(@Body() data: CreateCapabilityDto) {
    this.logger.log(`📥 Criando capability do tipo "${data.type}"`);
    return this.capabilityService.create(data);
  }

  /**
   * 🧩 Cria múltiplas capabilities de uma só vez para uma entidade
   */
  @Post('entity/:entityId/bulk')
  async createMany(
    @Param('entityId') entityId: string,
    @Body() data: Prisma.CapabilityCreateWithoutEntityInput[],
  ) {
    this.logger.log(`📥 Criando ${data.length} capabilities para entidade ${entityId}`);
    return this.capabilityService.createMany(entityId, data);
  }

  /**
   * 🔍 Lista todas as capabilities (com filtros opcionais)
   * Exemplo: /capabilities?type=task&entityId=abc123
   */
  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.capabilityService.findAll({ type, entityId });
  }

  /**
   * 🔍 Retorna uma capability específica
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.capabilityService.findOne(id);
  }

  /**
   * 🔍 Lista todas as capabilities de uma entidade
   */
  @Get('/entity/:entityId')
  async findByEntity(@Param('entityId') entityId: string) {
    return this.capabilityService.findByEntity(entityId);
  }

  /**
   * ✏️ Atualiza uma capability existente
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateCapabilityDto) {
    this.logger.log(`✏️ Atualizando capability ${id}`);
    return this.capabilityService.update(id, data);
  }

  /**
   * 🗑️ Remove uma capability
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.warn(`🗑️ Removendo capability ${id}`);
    return this.capabilityService.remove(id);
  }
}
