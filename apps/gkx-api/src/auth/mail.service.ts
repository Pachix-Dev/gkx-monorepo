import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ReactElement } from 'react';
import { Resend } from 'resend';
import { ResetPasswordEmailTemplate } from './email-templates/reset-password-email.template';
import { VerificationEmailTemplate } from './email-templates/verification-email.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey = process.env.API_KEY_RESEND;
  private readonly sender =
    process.env.EMAIL_RESEND_SENDER ?? 'onboarding@resend.dev';
  private readonly publicAppUrl =
    process.env.AUTH_PUBLIC_BASE_URL ?? 'http://localhost:3001';

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.publicAppUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await this.sendEmail({
      to: email,
      subject: 'Verifica tu correo',
      react: VerificationEmailTemplate({
        verifyUrl,
        logoUrl: 'https://gkx-app.yapura.dev/logo_gkx_white.png',
      }),
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.publicAppUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    await this.sendEmail({
      to: email,
      subject: 'Recuperacion de contrasena',
      react: ResetPasswordEmailTemplate({
        resetUrl,
        logoUrl: 'https://gkx-app.yapura.dev/logo_gkx_white.png',
      }),
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    react?: ReactElement;
  }): Promise<void> {
    if (!this.resendApiKey) {
      throw new InternalServerErrorException(
        'Missing API_KEY_RESEND configuration',
      );
    }

    const resend = new Resend(this.resendApiKey);

    try {
      await resend.emails.send({
        from: this.sender,
        to: params.to,
        subject: params.subject,
        html: params.html,
        react: params.react,
      });
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Email delivery failed for ${params.to}`, trace);
      throw new InternalServerErrorException(
        'Unable to deliver email at this time',
      );
    }
  }
}
