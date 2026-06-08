import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RefreshTokenSchema,
} from '@workout-pro/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: unknown) {
    const input = RegisterSchema.parse(body);
    return this.authService.register(input);
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.login(user.id, user.email);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown) {
    const { refreshToken } = RefreshTokenSchema.parse(body);
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: unknown) {
    const { refreshToken } = RefreshTokenSchema.parse(body);
    await this.authService.logout(refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() body: unknown) {
    const { email } = ForgotPasswordSchema.parse(body);
    await this.authService.forgotPassword(email);
    return { message: 'If that email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown) {
    const input = ResetPasswordSchema.parse(body);
    await this.authService.resetPassword(input);
    return { message: 'Password reset successfully' };
  }
}
