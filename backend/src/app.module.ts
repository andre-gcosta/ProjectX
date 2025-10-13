import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Serve o frontend React
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api*'], // não serve a pasta estática para rotas /api
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
