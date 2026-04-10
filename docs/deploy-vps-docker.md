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

## 4. Despliegue automático (CI/CD)

El workflow de GitHub Actions ejecuta automáticamente:

```bash
docker compose --env-file .env.vps pull
docker compose --env-file .env.vps up -d --remove-orphans
```

**Nota:** Las migraciones NO se ejecutan automáticamente. Debes hacerlas manualmente antes o después del deploy.

## 5. Ejecutar migraciones manualmente

### Opción A: Con contenedor temporal (recomendado)

```bash
cd /ruta/al/repo

# Ejecutar migraciones en un contenedor temporal
docker run --rm \
  --env-file .env.vps \
  --network host \
  ghcr.io/pachix-dev/gkx-api:latest \
  npm run migration:run
```

### Opción B: En el contenedor del API corriendo

```bash
docker exec gkx-api npm run migration:run
```

### Opción C: Ver el estado de migraciones sin ejecutarlas

```bash
docker exec gkx-api npm run migration:show
```

## 6. Flujo recomendado

1. **Primer deploy (con base de datos vacía):**

```bash
cd /ruta/al/repo
docker compose --env-file .env.vps pull
docker run --rm --env-file .env.vps --network host ghcr.io/pachix-dev/gkx-api:latest npm run migration:run
docker compose --env-file .env.vps up -d
```

2. **Despliegues posteriores:**

```bash
cd /ruta/al/repo
docker compose --env-file .env.vps pull
docker compose --env-file .env.vps up -d --remove-orphans

# Si hay cambios de schema pendientes, ejecuta migraciones:
docker run --rm --env-file .env.vps --network host ghcr.io/pachix-dev/gkx-api:latest npm run migration:run
```

## 7. Verificacion

```bash
docker ps
curl http://localhost:3020/api/health
curl -I http://localhost:3021
```

Si no tienes endpoint de health, valida un endpoint estable de la API.

## 8. Ver logs

```bash
docker logs -f gkx-api
docker logs -f gkx-web
```

## 9. Update de version

Si publicas imagenes por SHA, puedes desplegar una version puntual:

```bash
IMAGE_TAG=<sha> docker compose --env-file .env.vps up -d
```

## 10. Rollback rapido

```bash
IMAGE_TAG=<sha_anterior> docker compose --env-file .env.vps up -d
```
