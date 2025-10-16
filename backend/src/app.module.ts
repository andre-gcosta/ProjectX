import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Serve o frontend (React build)
    ServeStaticModule.forRootAsync({
      useFactory: async () => [
        {
          rootPath: join(__dirname, '..', '..', 'frontend/dist'),
          serveRoot: '/', // frontend disponível na raiz
          exclude: ['/api*'], // não interfere nas rotas de API
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
