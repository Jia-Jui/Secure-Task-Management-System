import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const authz = req.headers['authorization'] as string | undefined;
    if (!authz?.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = authz.slice(7);
    req.user = await this.auth.verify(token); // { sub, email, iat, exp }
    return true;
  }
}
