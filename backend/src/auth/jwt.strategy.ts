import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('🔐 Payload do token JWT:', payload); // Para debug
    
    // 🔥 CORREÇÃO: Retorna o objeto completo que será req.user
    return {
      id: payload.sub,      // ID do usuário
      userId: payload.sub,  // Também como userId para facilitar
      email: payload.email,
      role: payload.role,
      // Adicione outros campos do payload se necessário
      name: payload.name || '',
      // O payload completo também pode ser mantido
      ...payload
    };
  }
}