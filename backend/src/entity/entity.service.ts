import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 🧩 Cria uma nova entidade (com ou sem capabilities)
   * O userId é atribuído automaticamente via JWT
   */
  async create(data: CreateEntityDto) {
    const { capabilities, ...entityData } = data as any;

    return this.prisma.$transaction(async (tx) => {
      const entity = await tx.entity.create({ data: entityData });

      if (capabilities && capabilities.length > 0) {
        await tx.capability.createMany({
          data: capabilities.map((cap) => ({
            ...cap,
            entityId: entity.id,
          })),
        });
      }

      this.logger.log(`✅ Entity criada: ${entity.id} (user: ${entity.userId})`);

      return tx.entity.findUnique({
        where: { id: entity.id },
        include: { capabilities: true },
      });
    });
  }

  /**
   * 🔍 Retorna todas as entidades do usuário logado
   */
  async findAllByUser(
    userId: string,
    params?: { search?: string; type?: string },
  ) {
    const { search, type } = params || {};

    return this.prisma.entity.findMany({
      where: {
        userId,
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { content: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          type
            ? {
                capabilities: {
                  some: { type },
                },
              }
            : {},
        ],
      },
      include: {
        capabilities: true,
        outgoingLinks: true,
        incomingLinks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 🔍 Busca uma entidade por ID, validando se pertence ao usuário
   */
  async findOne(id: string, userId?: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        capabilities: true,
        outgoingLinks: true,
        incomingLinks: true,
      },
    });

    if (!entity) throw new NotFoundException(`Entity ${id} not found`);
    if (userId && entity.userId !== userId)
      throw new ForbiddenException('Acesso negado a esta entidade.');

    return entity;
  }

  /**
   * ✏️ Atualiza uma entidade (somente se pertencer ao usuário)
   */
  async update(id: string, data: UpdateEntityDto & { userId: string }) {
    await this.ensureOwnership(id, data.userId);

    const { capabilities, ...entityData } = data;
    const updated = await this.prisma.entity.update({
      where: { id },
      data: entityData,
    });

    if (capabilities?.length) {
      await this.prisma.capability.createMany({
        data: capabilities.map((cap) => ({ ...cap, entityId: id })),
      });
    }

    this.logger.log(`✏️ Entity atualizada: ${id} (user: ${data.userId})`);
    return this.findOne(id, data.userId);
  }

  /**
   * 🗑️ Remove uma entidade (somente se pertencer ao usuário)
   */
  async remove(id: string, userId: string) {
    await this.ensureOwnership(id, userId);

    await this.prisma.entity.delete({ where: { id } });
    this.logger.warn(`🗑️ Entity removida: ${id} (user: ${userId})`);

    return { message: `Entity ${id} removida com sucesso.` };
  }

  /**
   * 🧠 Adiciona uma capability à entidade (somente se for do usuário)
   */
  async addCapability(
    entityId: string,
    capabilityData: Prisma.CapabilityCreateWithoutEntityInput,
    userId: string,
  ) {
    await this.ensureOwnership(entityId, userId);

    const created = await this.prisma.capability.create({
      data: {
        ...capabilityData,
        entity: { connect: { id: entityId } },
      },
    });

    this.logger.log(
      `🧠 Capability criada (${created.type}) para entity ${entityId}`,
    );

    return created;
  }

  /**
   * 🔗 Cria link entre entidades (somente se origem pertencer ao usuário)
   */
  async linkEntities(sourceId: string, targetId: string, type: string, userId: string) {
    if (sourceId === targetId)
      throw new BadRequestException('Não é possível linkar uma entidade a ela mesma.');

    await this.ensureOwnership(sourceId, userId);
    await this.ensureEntityExists(targetId);

    try {
      const link = await this.prisma.link.create({
        data: {
          type,
          source: { connect: { id: sourceId } },
          target: { connect: { id: targetId } },
        },
      });
      this.logger.log(`🔗 Link criado: ${sourceId} -> ${targetId} (${type})`);
      return link;
    } catch (err) {
      if (err.code === 'P2002') {
        throw new ConflictException('Este link já existe entre as entidades.');
      }
      throw err;
    }
  }

  /**
   * Helper — garante que uma entidade existe
   */
  private async ensureEntityExists(id: string) {
    const exists = await this.prisma.entity.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Entity ${id} not found`);
  }

  /**
   * Helper — garante que o usuário é dono da entidade
   */
  private async ensureOwnership(id: string, userId: string) {
    const entity = await this.prisma.entity.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException(`Entity ${id} not found`);
    if (entity.userId !== userId)
      throw new ForbiddenException('Você não tem permissão para modificar esta entidade.');
  }
}
