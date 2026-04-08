# Deploy en VPS con Docker Compose

Este flujo despliega dos contenedores en el VPS:

- API NestJS en puerto host 3020
- Web Next.js en puerto host 3021
- PostgreSQL corre fuera de Docker (instalado en el VPS)

## 1. Archivos usados

- Compose: [docker-compose.yml](../docker-compose.yml)
- Variables de ejemplo: [.env.vps.example](../.env.vps.example)

## 2. Preparacion en VPS

1. Clonar el repo en el VPS.
2. Crear archivo de variables:

```bash
cp .env.vps.example .env.vps
```

3. Editar [.env.vps](../.env.vps.example) y ajustar al entorno real.

## 3. Conexion a PostgreSQL del host

Como Postgres corre en el host, usa `host.docker.internal` en `DATABASE_URL`.

Ejemplo:

```env
DATABASE_URL=postgres://postgres:TU_PASSWORD@host.docker.internal:5432/gkx_db
```

El compose ya incluye `extra_hosts: host.docker.internal:host-gateway` para Linux.

## 4. Primer despliegue manual

```bash
docker login ghcr.io

docker compose --env-file .env.vps pull
docker compose --env-file .env.vps up -d
```

## 5. Verificacion

```bash
docker ps
curl http://localhost:3020/api/health
curl -I http://localhost:3021
```

Si no tienes endpoint de health, valida un endpoint estable de la API.

## 6. Update de version

Si publicas imagenes por SHA, puedes desplegar una version puntual:

```bash
IMAGE_TAG=<sha> docker compose --env-file .env.vps up -d
```

## 7. Rollback rapido

```bash
IMAGE_TAG=<sha_anterior> docker compose --env-file .env.vps up -d
```
