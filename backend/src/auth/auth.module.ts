import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../prisma/prisma.service';
const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN ?? '7d';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
        secret: process.env.JWT_SECRET || 'dev_secret_change_me',
        signOptions: { expiresIn: jwtExpiresIn} as JwtSignOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
