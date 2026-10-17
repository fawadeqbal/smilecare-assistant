import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser, LoginRequest, LoginResponse } from '@smilecare/shared';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { AuthPrincipal } from '@/common/auth-principal';
import { CurrentUser, Public } from '@/common/decorators';
import { AuthService } from './auth.service';

class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin@smilecare.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthPrincipal): Promise<AuthUser> {
    return this.auth.me(user.userId);
  }
}
