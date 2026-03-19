import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { EmailActionTokenEntity } from './entities/email-action-token.entity';
import { MailService } from './mail.service';
import { SuperAdminBootstrap } from './super-admin.bootstrap';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      UserEntity,
      TenantEntity,
      AuthSessionEntity,
      EmailActionTokenEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SuperAdminBootstrap, MailService],
  exports: [AuthService],
})
export class AuthModule {}
