import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend/dist'), // build do frontend
      exclude: ['/api*'] // backend continua funcionando em /api
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
