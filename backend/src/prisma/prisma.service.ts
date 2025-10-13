import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: NodeJS.Timeout;

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Prisma conectado ao banco NeonDB (.pooler)');

    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        this.logger.debug('🔄 Ping enviado para manter conexão viva');
      } catch (err) {
        this.logger.error('❌ Falha no ping do banco', err);
      }
    }, 10 * 60 * 1000); // 10 minutos
  }

  async onModuleDestroy() {
    clearInterval(this.keepAliveInterval);
    await this.$disconnect();
  }
}
