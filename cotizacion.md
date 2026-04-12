# COTIZACION FORMAL

## 1. Datos generales

- Proyecto: GKX SaaS (estado actual del monorepo)
- Fecha: 12 de abril de 2026
- Proveedor: Equipo de desarrollo GKX
- Cliente: Por definir
- Vigencia de la cotizacion: 15 dias naturales
- Moneda: MXN
- Precio total del proyecto (alcance definido): $95,000 MXN + IVA

## 2. Objetivo del servicio

Consolidar, estabilizar y dejar operando en produccion el proyecto GKX en su estado actual, incluyendo backend, frontend, integracion de suscripciones y despliegue en VPS con Docker Compose.

## 3. Alcance incluido (estado actual)

### 3.1 Plataforma base

- Monorepo con npm workspaces.
- Aplicacion backend en NestJS.
- Aplicacion frontend en Next.js (App Router).
- Paquete compartido para tipos/DTOs comunes.

### 3.2 Modulos funcionales contemplados

Se considera dentro del alcance el estado funcional existente de los modulos ya presentes en el codigo fuente, incluyendo:

- Autenticacion y autorizacion (JWT, perfiles de usuario).
- Multi-tenant (tenants y usuarios por organizacion).
- Gestion operativa: goalkeepers, teams, training lines, training contents, exercises, training sessions.
- Seguimiento: attendance y evaluations.
- Capa SaaS: subscriptions, plan limits, dashboard y reports.

### 3.3 Suscripciones y facturacion

- Integracion con Stripe para checkout de suscripciones.
- Soporte del webhook de Stripe para sincronizacion de suscripciones.
- Soporte de reglas operativas existentes para upgrade/downgrade/cancelacion.
- Consideracion del flujo SPEI manual de acuerdo con la logica actual implementada.

### 3.4 Infraestructura y despliegue

- Despliegue en VPS mediante Docker Compose.
- Uso de archivo .env.vps para configuracion de entorno.
- Publicacion y ejecucion de contenedores API + Web.
- Ejecucion de migraciones de base de datos por procedimiento manual documentado.

### 3.5 Calidad y entrega tecnica

- Ajustes de configuracion para entorno productivo.
- Validacion funcional basica post-deploy.
- Entrega de guia operativa de despliegue y verificacion.

## 4. Entregables

- Entorno productivo desplegado y accesible (API + Web).
- Variables de entorno productivas documentadas.
- Configuracion de webhook Stripe en produccion (endpoint y eventos requeridos).
- Checklist de validacion de arranque y pruebas basicas.
- Documento de cierre tecnico con evidencias de despliegue.

## 5. Actividades fuera de alcance

- Desarrollo de modulos nuevos no existentes en el estado actual.
- Rediseno UX/UI completo o rebranding.
- Desarrollo de app movil nativa.
- Integraciones adicionales no presentes hoy (ERP, CRM, BI externo, etc.).
- Hardening avanzado de ciberseguridad (pentest, SOC, SIEM).
- Soporte 24/7 o mesa de ayuda continua posterior al periodo de estabilizacion.

## 6. Supuestos

- El cliente proporcionara accesos a VPS, dominio, DNS, proveedor de correo y Stripe.
- El cliente validara y aprobara textos legales/fiscales requeridos para cobro recurrente.
- La base de datos productiva estara disponible y con conectividad desde contenedores.
- El alcance corresponde al estado actual del codigo; cambios mayores se cotizan por separado.

## 7. Cronograma estimado

- Fase 1. Preparacion de entorno y variables: 2 a 3 dias habiles.
- Fase 2. Despliegue y configuracion Stripe webhook: 1 a 2 dias habiles.
- Fase 3. Validacion integral y ajustes de estabilizacion: 3 a 5 dias habiles.
- Fase 4. Entrega y cierre tecnico: 1 dia habil.

Duracion total estimada: 7 a 11 dias habiles.

## 8. Inversion

- Total del proyecto (alcance definido): $95,000 MXN + IVA.
- Implementacion y puesta en produccion (alcance definido): $95,000 MXN + IVA.
- Bolsa de soporte post-salida (opcional, 20 horas): $22,000 MXN + IVA.

## 9. Forma de pago

- 50% anticipo al inicio del servicio.
- 40% al concluir despliegue productivo y validacion funcional.
- 10% contra entrega de documentacion de cierre.

## 10. Garantia y soporte inicial

- Garantia de 30 dias naturales sobre incidencias atribuibles a configuracion y despliegue realizado.
- Incluye correcciones sin costo durante ese periodo dentro del alcance contratado.

## 11. Criterios de aceptacion

- API y Web accesibles en entorno productivo.
- Flujo de registro/login operativo.
- Webhook Stripe recibiendo y procesando eventos definidos.
- Operacion basica de modulos existentes sin errores bloqueantes.

## 12. Aprobacion

Nombre y firma del cliente: ****\*\*\*\*****\_\_\_\_****\*\*\*\*****

Nombre y firma del proveedor: ****\*\*\*\*****\_\_****\*\*\*\*****

Fecha de aprobacion: \_**\_ / \_\_** / **\_\_**
