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

Como Postgres corre en el host, configura las variables `DB_*` en `.env.vps`.

Ejemplo:

```env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD
DB_NAME=gkx_db
```

El compose ya incluye `extra_hosts: host.docker.internal:host-gateway` para Linux.

## 4. Primer despliegue manual

```bash
docker login ghcr.io

docker compose --env-file .env.vps pull
docker compose --profile migrations --env-file .env.vps run --rm migrations
docker compose --env-file .env.vps up -d
```

El comando con `--profile migrations` ejecuta las migraciones de TypeORM antes de iniciar la API.

## 4.1 Despliegues posteriores (automático)

Una vez la base de datos esté lista en el primer deploy, los despliegues posteriores ejecutan migraciones automáticamente:

```bash
docker compose --env-file .env.vps pull
docker compose --env-file .env.vps up -d
```

El servicio `migrations` se ejecuta automáticamente cada deploy y luego inicia el API.

## 4.2 Ejecutar migraciones manualmente (si es necesario)

```bash
docker compose --profile migrations --env-file .env.vps run --rm migrations
```

O desde el contenedor del API ya corriendo:

```bash
docker exec gkx-api npm run migration:run
```

## 5. Verificacion

```bash
docker ps
curl http://localhost:3020/api/health
curl -I http://localhost:3021
```

Si no tienes endpoint de health, valida un endpoint estable de la API.

## 6. Ver logs de migraciones

```bash
docker logs gkx-migrations
```

O el API:

```bash
docker logs -f gkx-api
```

## 7. Update de version

Si publicas imagenes por SHA, puedes desplegar una version puntual:

```bash
IMAGE_TAG=<sha> docker compose --env-file .env.vps up -d
```

Las migraciones se ejecutan automáticamente.

## 8. Rollback rapido

```bash
IMAGE_TAG=<sha_anterior> docker compose --env-file .env.vps up -d
```
