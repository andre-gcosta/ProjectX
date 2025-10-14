import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend/dist'), // aponta para build do frontend
      exclude: ['/api*'], // mantém as rotas do backend separadas
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
