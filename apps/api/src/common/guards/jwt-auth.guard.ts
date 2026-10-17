import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AdminRole } from '@smilecare/shared';
import type { Request } from 'express';
import type { AuthPrincipal, JwtPayload } from '../auth-principal';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';

/**
 * Global guard: every route requires a valid bearer token unless marked @Public().
 * Stateless (no session store), so any API instance can serve any request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException('Missing access token');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    req.user = { userId: payload.sub, businessId: payload.bid, role: payload.role, email: payload.email };

    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(req.user.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
