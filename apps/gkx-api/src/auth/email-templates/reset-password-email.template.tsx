import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type ResetPasswordEmailTemplateProps = {
  resetUrl: string;
  logoUrl: string;
};

export function ResetPasswordEmailTemplate({
  resetUrl,
  logoUrl,
}: ResetPasswordEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contrasena en GKX</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} alt="GKX" width="96" height="52" style={logo} />
          </Section>

          <Section style={content}>
            <Text style={h1}>Restablecer contrasena</Text>
            <Text style={paragraph}>
              Recibimos una solicitud para cambiar tu contrasena. Haz clic en el
              boton para continuar.
            </Text>

            <Button href={resetUrl} style={button}>
              Cambiar contrasena
            </Button>

            <Text style={note}>
              Por seguridad, este enlace expira pronto. Si no solicitaste este
              cambio, ignora este correo y tu cuenta seguira protegida.
            </Text>

            <Text style={paragraphMuted}>
              Si el boton no funciona, abre este enlace manualmente:
            </Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#f5f5f5',
  color: '#000000',
  fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
  padding: '24px 12px',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  margin: '0 auto',
  maxWidth: '560px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#000000',
  padding: '20px 24px',
};

const logo = {
  display: 'block',
};

const content = {
  padding: '28px 24px 24px',
};

const h1 = {
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 14px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const note = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  color: '#525252',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 16px',
  padding: '12px',
};

const paragraphMuted = {
  color: '#525252',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const link = {
  color: '#000000',
  display: 'block',
  fontSize: '12px',
  lineHeight: '1.6',
  marginBottom: '4px',
  wordBreak: 'break-all' as const,
};

const button = {
  backgroundColor: '#c7f703',
  borderRadius: '8px',
  color: '#000000',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '700',
  marginBottom: '20px',
  padding: '12px 18px',
  textDecoration: 'none',
};
