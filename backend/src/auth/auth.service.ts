// src/auth/auth.service.ts

import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registra um novo usuário no sistema.
   */
  async register(data: CreateUserDto) {
    // 1. Verifica se o e-mail já existe
    const exists = await this.usersService.findByEmail(data.email);
    if (exists) {
      throw new ConflictException('E-mail já cadastrado. Por favor, faça login.');
    }

    let user: User;

    try {
      // 2. NÃO hasheia aqui! O UsersService.createAdotante já faz isso.
      user = await this.usersService.createAdotante(data);
    } catch (error) {
      console.error('ERRO DE GRAVAÇÃO NO DB:', error);
      throw new InternalServerErrorException('Falha no servidor ao registrar o usuário.');
    }

    // 3. Retorna token + dados do usuário
    return this.buildToken(user);
  }

  /**
   * Valida as credenciais do usuário.
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  /**
   * Realiza o login do usuário.
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.buildToken(user);
  }

  /**
   * Cria o JWT e o objeto de retorno para o cliente.
   */
  buildToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adoptedAnimals: user.adoptedAnimals || [],
        interestedAnimals: user.interestedAnimals || [],
      },
    };
  }
}
