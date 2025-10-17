import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCapabilityDto } from './dto/create-capability.dto';
import { UpdateCapabilityDto } from './dto/update-capability.dto';
import { Prisma } from '@prisma/client';
import { EntityService } from '../entity/entity.service';

@Injectable()
export class CapabilityService {
  private readonly logger = new Logger(CapabilityService.name);

  constructor(
    private prisma: PrismaService,
    private entityService: EntityService,
  ) {}

  /**
   * Cria uma nova capability associada a uma entidade
   */
  async create(data: CreateCapabilityDto) {
    if (!data.entityId) {
      throw new BadRequestException('É necessário informar um entityId.');
    }

    await this.entityService.findOne(data.entityId);

    // separar entityId do restante
    const { entityId, type, data: capabilityData } = data;

    const capability = await this.prisma.capability.create({
      data: {
        type,
        data: capabilityData ?? {}, // nunca undefined, sempre um objeto JSON válido
        entity: { connect: { id: entityId } },
      },
      include: { entity: true },
    });

    this.logger.log(
      `🧩 Capability criada (${capability.type}) para entidade ${capability.entityId}`,
    );

    return capability;
  }

  /**
   * Retorna todas as capabilities (com filtros opcionais)
   */
  async findAll(params?: { type?: string; entityId?: string }) {
    const { type, entityId } = params || {};

    return this.prisma.capability.findMany({
      where: {
        AND: [type ? { type } : {}, entityId ? { entityId } : {}],
      },
      include: { entity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca uma capability por ID
   */
  async findOne(id: string) {
    const capability = await this.prisma.capability.findUnique({
      where: { id },
      include: { entity: true },
    });
    if (!capability)
      throw new NotFoundException(`Capability ${id} não encontrada.`);
    return capability;
  }

  /**
   * Atualiza uma capability existente
   */
  async update(id: string, data: UpdateCapabilityDto) {
    await this.findOne(id); // garante que existe

    const updated = await this.prisma.capability.update({
      where: { id },
      data,
      include: { entity: true },
    });

    this.logger.log(`✏️ Capability atualizada: ${id}`);
    return updated;
  }

  /**
   * Remove uma capability
   */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.capability.delete({ where: { id } });
    this.logger.warn(`🗑️ Capability removida: ${id}`);
    return { message: `Capability ${id} removida com sucesso.` };
  }

  /**
   * Lista todas as capabilities de uma entidade específica
   */
  async findByEntity(entityId: string) {
    await this.entityService.findOne(entityId);
    return this.prisma.capability.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria várias capabilities de uma só vez
   */
  async createMany(
    entityId: string,
    capabilities: Prisma.CapabilityCreateWithoutEntityInput[],
  ) {
    await this.entityService.findOne(entityId);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.capability.createMany({
        data: capabilities.map((c) => ({
          ...c,
          entityId,
          data: c.data ?? {}, // garante JSON válido
        })),
      });

      this.logger.log(
        `🧩 Criadas ${created.count} capabilities para entidade ${entityId}`,
      );

      return this.findByEntity(entityId);
    });
  }
}
