import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('entities')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  /**
   * 🧩 Cria uma nova entidade (com capabilities opcionais)
   * O usuário logado é atribuído automaticamente
   */
  @Post()
  async create(
    @Body() dto: CreateEntityDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.entityService.create({
      ...dto,
      userId: user.userId, // associa o autor da entidade
    });
  }

  /**
   * 🔍 Retorna todas as entidades do usuário logado
   * Com filtros opcionais: /entities?type=task&search=meta
   */
  @Get()
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.entityService.findAllByUser(user.userId, { type, search });
  }

  /**
   * 🔍 Retorna uma entidade pelo ID (somente se pertencer ao usuário)
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.entityService.findOne(id, user.userId);
  }

  /**
   * ✏️ Atualiza uma entidade existente (ownership garantido)
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.entityService.update(id, { ...dto, userId: user.userId });
  }

  /**
   * 🗑️ Remove uma entidade (somente se for do usuário)
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.entityService.remove(id, user.userId);
  }

  /**
   * 🧠 Adiciona uma capability à entidade existente (verifica ownership)
   */
  @Post(':id/capabilities')
  async addCapability(
    @Param('id') id: string,
    @Body() capabilityData: Prisma.CapabilityCreateWithoutEntityInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.entityService.addCapability(id, capabilityData, user.userId);
  }

  /**
   * 🔗 Cria um link entre duas entidades (somente se origem for do usuário)
   */
  @Post(':id/link')
  async linkEntities(
    @Param('id') sourceId: string,
    @Body() body: { targetId: string; type: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.entityService.linkEntities(
      sourceId,
      body.targetId,
      body.type,
      user.userId,
    );
  }
}