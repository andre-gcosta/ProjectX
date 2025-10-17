import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntityModule } from './entity/entity.module';
import { CapabilityModule } from './capabilities/capability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EntityModule,
    CapabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
