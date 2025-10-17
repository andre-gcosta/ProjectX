import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // torna disponível globalmente, sem precisar importar em todos os módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
