import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AdminRole } from '@smilecare/shared';
import type { AuthPrincipal } from '../auth-principal';

export const IS_PUBLIC_KEY = 'isPublic';
/** Opt a route out of the global JWT guard (widget and login endpoints). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restrict a route to specific admin roles. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/** The authenticated admin. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthPrincipal => ctx.switchToHttp().getRequest().user,
);

/** The tenant id of the authenticated admin. Every admin query is scoped by it. */
export const BusinessId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => (ctx.switchToHttp().getRequest().user as AuthPrincipal).businessId,
);
