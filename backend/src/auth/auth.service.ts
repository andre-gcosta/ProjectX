import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN ?? '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida credenciais. Retorna o usuário sem a senha.
   */
  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    const { password: _p, ...rest } = user as any;
    return rest;
  }

  /**
   * Gera token e retorna user + access_token
   */
  async login(user: any) {
    const payload: object = { email: user.email, sub: user.id };
    const options: JwtSignOptions = {
        expiresIn: jwtExpiresIn,
    } as JwtSignOptions
    const token = this.jwtService.sign(payload, options);
    return { access_token: token, user };
  }

  /**
   * Cria usuário (hash) e retorna login automático
   */
  async register(email: string, password: string, name?: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('Email já cadastrado');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userService.create({ email, password: hashed, name });
    const { password: _p, ...userWithoutPass } = user as any;
    return this.login(userWithoutPass);
  }
}