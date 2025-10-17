import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
   * Cria uma nova entidade (com ou sem capabilities)
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

      this.logger.log(`✅ Entity criada: ${entity.id}`);

      return tx.entity.findUnique({
        where: { id: entity.id },
        include: { capabilities: true },
      });
    });
  }

  /**
   * Retorna todas as entidades (com filtros e paginação)
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    type?: string;
  }) {
    const { skip, take, search, type } = params || {};

    return this.prisma.entity.findMany({
      where: {
        title: search ? { contains: search, mode: 'insensitive' } : undefined,
        capabilities: type
          ? {
              some: { type },
            }
          : undefined,
      },
      include: {
        capabilities: true,
        outgoingLinks: true,
        incomingLinks: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Busca uma entidade por ID (com relações)
   */
  async findOne(id: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        capabilities: true,
        outgoingLinks: true,
        incomingLinks: true,
      },
    });
    if (!entity) throw new NotFoundException(`Entity ${id} not found`);
    return entity;
  }

  /**
   * Atualiza uma entidade
   */
  async update(id: string, data: UpdateEntityDto) {
    const { capabilities, ...entityData } = data; // remove capabilities do objeto
    const updated = await this.prisma.entity.update({
      where: { id },
      data: entityData,
    });

    // se quiser atualizar capabilities inline, faz separadamente
    if (capabilities?.length) {
      await this.prisma.capability.createMany({
        data: capabilities.map((cap) => ({ ...cap, entityId: id })),
      });
    }

    return this.findOne(id);
  }

  /**
   * Remove uma entidade
   */
  async remove(id: string) {
    await this.findOne(id); // garante que existe
    await this.prisma.entity.delete({ where: { id } });
    this.logger.warn(`🗑️ Entity removida: ${id}`);
    return { message: `Entity ${id} removida com sucesso.` };
  }

  /**
   * Adiciona uma capability à entidade
   */
  async addCapability(
    entityId: string,
    capabilityData: Prisma.CapabilityCreateWithoutEntityInput,
  ) {
    await this.ensureEntityExists(entityId);

    return this.prisma.capability.create({
      data: {
        ...capabilityData,
        entity: { connect: { id: entityId } },
      },
    });
  }

  /**
   * Cria link entre entidades (validação + unicidade)
   */
  async linkEntities(sourceId: string, targetId: string, type: string) {
    if (sourceId === targetId)
      throw new BadRequestException(
        'Não é possível linkar uma entidade a ela mesma.',
      );

    await Promise.all([
      this.ensureEntityExists(sourceId),
      this.ensureEntityExists(targetId),
    ]);

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

  async findAllFiltered(type?: string, search?: string) {
    return this.prisma.entity.findMany({
      where: {
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
}
