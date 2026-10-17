import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser, LoginResponse } from '@smilecare/shared';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import type { JwtPayload } from '@/common/auth-principal';
import { AppConfig } from '@/config/app-config.service';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { adminUsers, businesses } from '@/infrastructure/database/schema';

/** Hash compared against when the email doesn't exist, so response time doesn't reveal valid emails. */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const [row] = await this.db
      .select({ user: adminUsers, businessName: businesses.name })
      .from(adminUsers)
      .innerJoin(businesses, eq(businesses.id, adminUsers.businessId))
      .where(sql`lower(${adminUsers.email}) = ${email.toLowerCase()}`)
      .limit(1);

    const valid = await bcrypt.compare(password, row?.user.passwordHash ?? DUMMY_HASH);
    if (!row || !valid) throw new UnauthorizedException('Invalid email or password');

    await this.db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, row.user.id));

    const payload: JwtPayload = { sub: row.user.id, bid: row.user.businessId, role: row.user.role, email: row.user.email };
    const expiresIn = this.config.get('JWT_EXPIRES_IN_SECONDS');
    return {
      accessToken: await this.jwt.signAsync(payload, { expiresIn }),
      expiresIn,
      user: toAuthUser(row.user, row.businessName),
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const [row] = await this.db
      .select({ user: adminUsers, businessName: businesses.name })
      .from(adminUsers)
      .innerJoin(businesses, eq(businesses.id, adminUsers.businessId))
      .where(eq(adminUsers.id, userId))
      .limit(1);
    if (!row) throw new UnauthorizedException();
    return toAuthUser(row.user, row.businessName);
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

function toAuthUser(user: typeof adminUsers.$inferSelect, businessName: string): AuthUser {
  return { id: user.id, email: user.email, role: user.role, businessId: user.businessId, businessName };
}
