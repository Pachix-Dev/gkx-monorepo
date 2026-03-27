import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey = process.env.API_KEY_RESEND;
  private readonly sender =
    process.env.EMAIL_RESEND_SENDER ?? 'onboarding@resend.dev';
  private readonly publicAppUrl =
    process.env.AUTH_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.publicAppUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
    await this.sendEmail({
      to: email,
      subject: 'Verifica tu correo en GKX',
      html: `<p>Bienvenido a GKX.</p><p>Para activar tu cuenta, verifica tu correo aqui:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.publicAppUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    await this.sendEmail({
      to: email,
      subject: 'Recuperacion de contrasena en GKX',
      html: `<p>Recibimos una solicitud para restablecer tu contrasena.</p><p>Usa este enlace:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
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
