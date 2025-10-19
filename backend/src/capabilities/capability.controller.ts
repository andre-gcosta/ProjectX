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
  UseGuards,
} from '@nestjs/common';
import { CapabilityService } from './capability.service';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('capabilities')
export class CapabilityController {
  private readonly logger = new Logger(CapabilityController.name);

  constructor(private readonly capabilityService: CapabilityService) {}

  /**
   * 🧩 Cria uma nova capability
   */
  @Post()
  async create(
    @Body() data: CreateCapabilityDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    this.logger.log(`📥 Criando capability do tipo "${data.type}" por usuário ${user.userId}`);
    return this.capabilityService.create(data, user.userId);
  }

  /**
   * 🧩 Cria múltiplas capabilities de uma só vez para uma entidade
   */
  @Post('entity/:entityId/bulk')
  async createMany(
    @Param('entityId') entityId: string,
    @Body() data: Prisma.CapabilityCreateWithoutEntityInput[],
    @CurrentUser() user: { userId: string },
  ) {
    this.logger.log(`📥 Criando ${data.length} capabilities para entidade ${entityId} por ${user.userId}`);
    return this.capabilityService.createMany(entityId, data, user.userId);
  }

  /**
   * 🔍 Lista todas as capabilities do usuário (com filtros opcionais)
   */
  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.capabilityService.findAll(user.userId, { type, entityId });
  }

  /**
   * 🔍 Retorna uma capability específica
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.capabilityService.findOne(id, user.userId);
  }

  /**
   * 🔍 Lista todas as capabilities de uma entidade
   */
  @Get('/entity/:entityId')
  async findByEntity(
    @Param('entityId') entityId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.capabilityService.findByEntity(entityId, user.userId);
  }

  /**
   * ✏️ Atualiza uma capability existente
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCapabilityDto,
    @CurrentUser() user: { userId: string },
  ) {
    this.logger.log(`✏️ Atualizando capability ${id} por ${user.userId}`);
    return this.capabilityService.update(id, data, user.userId);
  }

  /**
   * 🗑️ Remove uma capability
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    this.logger.warn(`🗑️ Removendo capability ${id} por ${user.userId}`);
    return this.capabilityService.remove(id, user.userId);
  }
}
