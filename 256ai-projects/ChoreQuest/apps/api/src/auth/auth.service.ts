import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  householdId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiry: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshTokenExpiry = this.config.get<string>(
      'REFRESH_TOKEN_EXPIRY',
      '7d',
    );
  }

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // Create household and parent user in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: { name: `${dto.displayName}'s Household` },
      });

      return tx.user.create({
        data: {
          household_id: household.id,
          email: dto.email,
          password_hash: passwordHash,
          display_name: dto.displayName,
          role: 'parent',
        },
      });
    });

    return this.generateTokens(user.id, user.email!, user.role, user.household_id);
  }

  async login(dto: LoginDto, deviceName?: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.password_hash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email!, user.role, user.household_id, deviceName);
  }

  async refresh(refreshToken: string, deviceName?: string): Promise<AuthTokens> {
    // Find all non-revoked sessions and check token against each
    const sessions = await this.prisma.refreshTokenSession.findMany({
      where: { revoked_at: null },
      include: { user: true },
    });

    let matchedSession: (typeof sessions)[number] | null = null;
    for (const session of sessions) {
      const valid = await argon2.verify(session.token, refreshToken);
      if (valid) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (matchedSession.expires_at < new Date()) {
      // Revoke expired token
      await this.prisma.refreshTokenSession.update({
        where: { id: matchedSession.id },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: revoke old token
    await this.prisma.refreshTokenSession.update({
      where: { id: matchedSession.id },
      data: { revoked_at: new Date() },
    });

    const user = matchedSession.user;
    return this.generateTokens(
      user.id,
      user.email!,
      user.role,
      user.household_id,
      deviceName ?? matchedSession.device_name ?? undefined,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const sessions = await this.prisma.refreshTokenSession.findMany({
      where: { revoked_at: null },
    });

    for (const session of sessions) {
      const valid = await argon2.verify(session.token, refreshToken);
      if (valid) {
        await this.prisma.refreshTokenSession.update({
          where: { id: session.id },
          data: { revoked_at: new Date() },
        });
        return;
      }
    }

    // If token not found, still return success (idempotent)
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        display_name: true,
        role: true,
        household_id: true,
      },
    });
    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    householdId: string,
    deviceName?: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      householdId,
    };

    const accessToken = this.jwt.sign(payload);

    // Generate a cryptographically random refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawRefreshToken, {
      type: argon2.argon2id,
    });

    const expiresAt = this.calculateExpiry(this.refreshTokenExpiry);

    await this.prisma.refreshTokenSession.create({
      data: {
        user_id: userId,
        token: hashedToken,
        device_name: deviceName ?? null,
        expires_at: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
