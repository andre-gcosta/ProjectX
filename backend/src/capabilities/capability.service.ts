import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
   * 🧩 Cria uma nova capability associada a uma entidade do usuário
   */
  async create(
    data: CreateCapabilityDto,
    userId: string, // 🔐 quem está criando
  ) {
    if (!data.entityId) {
      throw new BadRequestException('É necessário informar um entityId.');
    }

    // garante que a entidade existe e pertence ao usuário
    const entity = await this.entityService.findOne(data.entityId, userId);

    const { entityId, type, data: capabilityData } = data;

    const capability = await this.prisma.capability.create({
      data: {
        type,
        data: capabilityData ?? {}, // nunca undefined
        entity: { connect: { id: entityId } },
      },
      include: { entity: true },
    });

    this.logger.log(
      `🧩 Capability (${capability.type}) criada para entidade ${entity.id} por usuário ${userId}`,
    );

    return capability;
  }

  /**
   * 🔍 Retorna todas as capabilities do usuário (opcionalmente filtradas)
   */
  async findAll(userId: string, params?: { type?: string; entityId?: string }) {
    const { type, entityId } = params || {};

    return this.prisma.capability.findMany({
      where: {
        AND: [
          type ? { type } : {},
          entityId ? { entityId } : {},
          { entity: { userId } }, // 🔐 só do usuário
        ],
      },
      include: { entity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 🔍 Busca uma capability (verifica ownership)
   */
  async findOne(id: string, userId: string) {
    const capability = await this.prisma.capability.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!capability)
      throw new NotFoundException(`Capability ${id} não encontrada.`);

    if (capability.entity.userId !== userId)
      throw new ForbiddenException('Acesso negado a esta capability.');

    return capability;
  }

  /**
   * ✏️ Atualiza uma capability (verifica se pertence ao usuário)
   */
  async update(id: string, data: UpdateCapabilityDto, userId: string) {
    const existing = await this.findOne(id, userId);

    const updated = await this.prisma.capability.update({
      where: { id: existing.id },
      data: {
        type: data.type ?? existing.type,
        data: data.data ?? existing.data as Prisma.InputJsonValue,
      },
      include: { entity: true },
    });

    this.logger.log(`✏️ Capability atualizada (${id}) por ${userId}`);
    return updated;
  }

  /**
   * 🗑️ Remove uma capability (se pertencer ao usuário)
   */
  async remove(id: string, userId: string) {
    const capability = await this.findOne(id, userId);

    await this.prisma.capability.delete({ where: { id: capability.id } });
    this.logger.warn(`🗑️ Capability ${id} removida por ${userId}`);

    return { message: `Capability ${id} removida com sucesso.` };
  }

  /**
   * 🔗 Lista todas as capabilities de uma entidade (somente se for do usuário)
   */
  async findByEntity(entityId: string, userId: string) {
    const entity = await this.entityService.findOne(entityId, userId);

    return this.prisma.capability.findMany({
      where: { entityId: entity.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ⚙️ Cria várias capabilities de uma só vez (bulk insert)
   */
  async createMany(
    entityId: string,
    capabilities: Prisma.CapabilityCreateWithoutEntityInput[],
    userId: string,
  ) {
    const entity = await this.entityService.findOne(entityId, userId);

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.capability.createMany({
        data: capabilities.map((c) => ({
          ...c,
          entityId: entity.id,
          data: c.data ?? {},
        })),
      });

      this.logger.log(
        `🧩 Criadas ${created.count} capabilities para entidade ${entity.id} (usuário ${userId})`,
      );

      return this.findByEntity(entity.id, userId);
    });
  }
}