# GKX Monorepo

Monorepo con dos aplicaciones:

- `apps/gkx-api`: API en NestJS.
- `apps/gkx-web-app`: frontend en Next.js.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

Desde la raíz del monorepo:

```bash
npm install
```

## Desarrollo

En terminales separadas:

```bash
npm run dev:api
npm run dev:web
```

## Build

```bash
npm run build
```

También puedes compilar por app:

```bash
npm run build:api
npm run build:web
```

## Lint y tests

```bash
npm run lint
npm run test
```

O por app:

```bash
npm run lint:api
npm run lint:web
npm run test:api
npm run test:web
```

## Estructura

```text
apps/
  gkx-api/
  gkx-web-app/
```

## Notas

- Este repositorio usa npm workspaces (`apps/*`).
- Mantener una sola instalación de dependencias en la raíz.
- Evitar `node_modules` dentro de cada app.
