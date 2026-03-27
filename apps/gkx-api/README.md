# GKX API (NestJS)

Backend principal del proyecto GKX.

## Ejecutar en desarrollo

Desde la raíz del monorepo:

```bash
npm run dev:api
```

Desde esta carpeta:

```bash
npm run start:dev
```

## Build

Desde la raíz:

```bash
npm run build:api
```

Desde esta carpeta:

```bash
npm run build
```

## Tests y lint

```bash
npm run test
npm run test:e2e
npm run lint
```

## Variables de entorno

Usar `.env` local basado en `.env.example`.

Variables clave para suscripcion recurrente:

```env
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
BILLING_BASE_URL="http://localhost:3001"
STRIPE_PRICE_ID_BASIC="price_xxx"
STRIPE_PRICE_ID_PRO="price_xxx"
STRIPE_PRICE_ID_ENTERPRISE="price_xxx"
```

## Probar webhook Stripe end-to-end

Prerequisitos:

- Stripe CLI instalado y autenticado (`stripe login`).
- API corriendo en local (`npm run start:dev`).

1. En una terminal, iniciar listener y forward al webhook local:

```bash
npm run stripe:webhook:listen
```

2. Copiar el `whsec_...` que imprime Stripe CLI y guardarlo en `.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

3. Reiniciar API para cargar el nuevo secret.

4. En otra terminal, disparar eventos de suscripcion:

```bash
npm run stripe:webhook:trigger
```

5. Validar en logs/API que se procese:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Endpoint usado por el listener:

- `POST /api/subscriptions/webhooks/stripe`

Nota:

- Para que sincronice tenant/plan correctamente, los eventos de Stripe deben incluir `metadata.tenantId` en la suscripcion.

## Documentación de dominio

La documentación funcional y de roles está en `AI_SPEC.md`.
