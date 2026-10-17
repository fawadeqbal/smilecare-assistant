import type { AdminRole } from '@smilecare/shared';

/** The authenticated admin attached to each request by the JWT guard. */
export interface AuthPrincipal {
  userId: string;
  businessId: string;
  role: AdminRole;
  email: string;
}

export interface JwtPayload {
  sub: string;
  bid: string;
  role: AdminRole;
  email: string;
}
