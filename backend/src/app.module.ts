import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend/dist'),
      exclude: ['/api/(.*)'], // ✅ sintaxe nova
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
