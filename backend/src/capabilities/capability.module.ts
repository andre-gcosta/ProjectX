import { Module } from '@nestjs/common';
import { CapabilityService } from './capability.service';
import { CapabilityController } from './capability.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EntityModule } from '../entity/entity.module';

@Module({
  imports: [PrismaModule, EntityModule],
  controllers: [CapabilityController],
  providers: [CapabilityService],
  exports: [CapabilityService],
})
export class CapabilityModule {}
