import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval?: NodeJS.Timeout;

  /**
   * Conecta o Prisma ao NeonDB e inicia ping periódico
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Prisma conectado ao banco NeonDB (.pooler)');

    // Ping periódico para manter a conexão viva
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        this.logger.debug('🔄 Ping enviado para manter conexão viva');
      } catch (err) {
        this.logger.error('❌ Falha no ping do banco', err);
      }
    }, 10 * 60 * 1000); // 10 minutos
  }

  /**
   * Limpa o intervalo de ping e desconecta do Prisma
   */
  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    await this.$disconnect();
    this.logger.log('🛑 Prisma desconectado');
  }
}
