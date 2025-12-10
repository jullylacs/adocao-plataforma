import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  canActivate(context: ExecutionContext) {
    // Chama o método original do AuthGuard
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se tiver erro ou não tiver usuário, lança exceção
    if (err || !user) {
      throw err || new UnauthorizedException('Não autorizado');
    }
    
    // 🔥 IMPORTANTE: Adiciona o usuário ao request
    const request = context.switchToHttp().getRequest();
    request.user = user;
    
    return user;
  }
}