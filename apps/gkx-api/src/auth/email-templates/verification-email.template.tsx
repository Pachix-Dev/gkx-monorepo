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

type VerificationEmailTemplateProps = {
  verifyUrl: string;
  logoUrl: string;
};

export function VerificationEmailTemplate({
  verifyUrl,
  logoUrl,
}: VerificationEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Verifica tu correo para activar tu cuenta en GKX</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoUrl} alt="GKX" width="140" height="46" style={logo} />
          </Section>

          <Section style={content}>
            <Text style={h1}>Verifica tu correo</Text>
            <Text style={paragraph}>
              Gracias por registrarte en GKX. Para activar tu cuenta, confirma
              tu email con el siguiente boton.
            </Text>

            <Button href={verifyUrl} style={button}>
              Verificar email
            </Button>

            <Text style={paragraphMuted}>
              Si el boton no funciona, copia y pega este enlace en tu navegador:
            </Text>
            <Link href={verifyUrl} style={link}>
              {verifyUrl}
            </Link>

            <Text style={footerText}>
              Si no creaste esta cuenta, puedes ignorar este mensaje.
            </Text>
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
  marginBottom: '20px',
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

const footerText = {
  borderTop: '1px solid #e5e7eb',
  color: '#525252',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
  paddingTop: '16px',
};
