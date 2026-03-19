import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
} from '../common/swagger/openapi.decorators';
import {
  AuthActionEmailDispatchedModel,
  AuthLoginDataModel,
  AuthMeDataModel,
  AuthPasswordResetStatusModel,
  AuthRegisterDataModel,
  AuthVerificationStatusModel,
  LogoutDataModel,
} from '../common/swagger/response-models';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @ApiOperation({
    summary: 'Registrar tenant y usuario administrador',
    description: 'Crea un tenant nuevo y su TENANT_ADMIN inicial.',
  })
  @ApiTypedSuccessResponse({
    message: 'Tenant registered successfully',
    status: 201,
    model: AuthRegisterDataModel,
  })
  @ApiCommonErrorResponses()
  async registerTenant(@Body() dto: RegisterTenantDto) {
    const data = await this.authService.registerTenant(dto);

    return {
      success: true,
      message: 'Tenant registered successfully',
      data,
    };
  }

  @Post('verify-email/request')
  @ApiOperation({ summary: 'Solicitar reenvio de verificacion de correo' })
  @ApiTypedSuccessResponse({
    message: 'If the email exists, a verification message has been sent',
    model: AuthActionEmailDispatchedModel,
  })
  @ApiCommonErrorResponses()
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    const data = await this.authService.requestEmailVerification(dto);

    return {
      success: true,
      message: 'If the email exists, a verification message has been sent',
      data,
    };
  }

  @Post('verify-email/confirm')
  @ApiOperation({ summary: 'Confirmar verificacion de correo' })
  @ApiTypedSuccessResponse({
    message: 'Email verified successfully',
    model: AuthVerificationStatusModel,
  })
  @ApiCommonErrorResponses()
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const data = await this.authService.verifyEmail(dto);

    return {
      success: true,
      message: 'Email verified successfully',
      data,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiTypedSuccessResponse({ message: 'Login successful', model: AuthLoginDataModel })
  @ApiCommonErrorResponses()
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);

    return {
      success: true,
      message: 'Login successful',
      data,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  @ApiTypedSuccessResponse({
    message: 'Token refreshed successfully',
    model: AuthLoginDataModel,
  })
  @ApiCommonErrorResponses()
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refresh(dto);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperacion de contrasena por correo' })
  @ApiTypedSuccessResponse({
    message: 'If the email exists, a password reset message has been sent',
    model: AuthActionEmailDispatchedModel,
  })
  @ApiCommonErrorResponses()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto);

    return {
      success: true,
      message: 'If the email exists, a password reset message has been sent',
      data,
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contrasena con token' })
  @ApiTypedSuccessResponse({
    message: 'Password reset successfully',
    model: AuthPasswordResetStatusModel,
  })
  @ApiCommonErrorResponses()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(dto);

    return {
      success: true,
      message: 'Password reset successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Cerrar sesion del usuario actual' })
  @ApiTypedSuccessResponse({ message: 'Logout successful', model: LogoutDataModel })
  @ApiCommonErrorResponses()
  async logout(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.authService.logout(user);

    return {
      success: true,
      message: 'Logout successful',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  @ApiTypedSuccessResponse({
    message: 'Current user retrieved successfully',
    model: AuthMeDataModel,
  })
  @ApiCommonErrorResponses()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.authService.me(user);

    return {
      success: true,
      message: 'Current user retrieved successfully',
      data,
    };
  }
}
