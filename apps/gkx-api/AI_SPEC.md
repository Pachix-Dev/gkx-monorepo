# AI_SPEC.md
## Goalkeeper Training Management SaaS
### NestJS + Next.js Full Stack Architecture

---

## 🧠 Product Vision

Aplicación SaaS para la **gestión integral del entrenamiento de porteros**, orientada a:

- Academias de porteros
- Clubes profesionales y amateur
- Entrenadores independientes
- Escuelas formativas

El sistema debe permitir **planificar, ejecutar, evaluar y medir el progreso técnico, físico y táctico de los porteros**, con enfoque multi-tenant y una estructura pedagógica real de entrenamiento.

---

## ⚙️ Tech Stack

### Backend
- NestJS
- PostgreSQL
- TYPEORM
- JWT Authentication (Access + Refresh)
- Passport
- bcrypt
- Swagger
- Docker
- Redis (opcional)
- Stripe / MercadoPago (billing SaaS)

### Frontend
- Next.js
- Tailwind / MUI
- TanStack Query
- JWT auth flow

---

## 🧩 SaaS Architecture

Modelo **multi-tenant shared database**.

Cada registro relevante contiene:

```txt
tenantId
```

Aislamiento lógico por academia o club.

Ejemplo tenants:
- Elite GK Academy
- Bajo Palos FC

---

## 👥 User Roles

- SUPER_ADMIN
- USER

---

## 🧠 Nueva lógica pedagógica del dominio

La app ya no debe modelarse solo como:

```txt
Session -> Exercises
```

Ahora debe funcionar así:

```txt
TrainingLine -> TrainingContent -> Exercise
TrainingSession -> SessionContent -> SessionExercise
```

### Conceptos

#### TrainingLine
Bloque macro de entrenamiento.

Ejemplos:
- Calentamiento
- Técnica de blocaje
- Juego aéreo
- Velocidad de reacción
- Juego con pies
- Fuerza específica

#### TrainingContent
Conjunto estructurado de ejercicios dentro de una línea de entrenamiento.

Ejemplo:
- Línea: Calentamiento
- Contenido: Calentamiento de velocidad

#### Exercise
Unidad mínima ejecutable. Tarea o ejercicio puntual.

Ejemplo:
- skipping corto entre conos
- sprint lateral con caída
- reacción a estímulo visual
- desplazamiento frontal + blocaje

#### TrainingSession
Una sesión puede:
- elegir uno o varios contenidos
- y dentro de cada contenido seleccionar solo algunos ejercicios
- además personalizar duración, repeticiones, descanso y notas sin alterar la plantilla original

---

## 📦 Core Modules (NestJS)

```txt
auth
users
tenants
subscriptions
teams
goalkeepers
coaches
training-lines
training-contents
exercises
training-sessions
session-contents
session-exercises
attendance
evaluations
metrics
reports
notifications
files
```

---

## 🧱 Main Domain Entities

### Tenant
Academia o club

- id
- name
- slug
- plan
- status
- createdAt

---

### User

- id
- tenantId
- fullName
- email
- passwordHash
- role
- status

---

### GoalkeeperProfile

- id
- tenantId
- userId
- dateOfBirth
- dominantHand
- dominantFoot
- height
- weight
- category
- teamId
- medicalNotes
- parentContact

---

### CoachProfile

- id
- tenantId
- userId
- specialty
- licenseLevel
- experienceYears

---

### Team

- id
- tenantId
- name
- category
- season
- coachId

---

### TrainingLine

Representa una línea o bloque metodológico.

- id
- tenantId
- name
- description
- color
- icon
- order
- status
- createdAt
- updatedAt

Ejemplos:
- Calentamiento
- Técnica
- Reacción
- Juego aéreo
- Fuerza
- Distribución

---

### TrainingContent

Representa un conjunto de ejercicios asociados a una línea de entrenamiento.

- id
- tenantId
- trainingLineId
- name
- description
- objective
- level
- estimatedDurationMinutes
- createdBy
- status
- createdAt
- updatedAt

Ejemplo:
- Línea: Calentamiento
- Contenido: Calentamiento de velocidad

---

### Exercise

Ejercicio o tarea puntual dentro de un contenido.

- id
- tenantId
- trainingContentId
- name
- description
- instructions
- objective
- durationMinutes
- repetitions
- restSeconds
- equipment
- videoUrl
- difficulty
- order
- status
- createdAt
- updatedAt

---

### TrainingSession

Sesión de entrenamiento.

- id
- tenantId
- title
- description
- date
- startTime
- endTime
- coachId
- teamId
- location
- notes
- status
- createdAt
- updatedAt

---

### SessionContent

Relación entre sesión y contenido.

- id
- tenantId
- sessionId
- trainingContentId
- order
- notes
- customDurationMinutes

---

### SessionExercise

Relación entre sesión y ejercicio.

Sirve para indicar qué ejercicios concretos se usarán en esa sesión.

- id
- tenantId
- sessionId
- sessionContentId
- exerciseId
- order
- selected
- customDurationMinutes
- customRepetitions
- customRestSeconds
- coachNotes

---

### Attendance

- id
- tenantId
- sessionId
- goalkeeperId
- status
- comment

Status:
- PRESENT
- ABSENT
- LATE
- JUSTIFIED

---

### Evaluation

Evaluación técnica integral.

- goalkeeperId
- coachId
- date
- handling
- diving
- positioning
- reflexes
- communication
- footwork
- distribution
- aerialPlay
- oneVsOne
- mentality
- overallScore
- comments

---

### MetricRecord

Tracking físico y performance.

- metricType
- value
- unit
- date

Ejemplos:
- ReactionTime
- VerticalJump
- SavePercentage
- DistributionAccuracy
- LateralSpeed

---

### Subscription

- tenantId
- provider
- plan
- status
- periodStart
- periodEnd

---

## 🔗 Relación conceptual del dominio

```txt
TrainingLine
   └── TrainingContent
          └── Exercise

TrainingSession
   └── SessionContent
          └── SessionExercise
```

Relación completa:

```txt
TrainingLine 1---N TrainingContent
TrainingContent 1---N Exercise

TrainingSession 1---N SessionContent
SessionContent N---1 TrainingContent

TrainingSession 1---N SessionExercise
SessionExercise N---1 Exercise
SessionExercise N---1 SessionContent
```

---

## ✅ Flujo de negocio esperado

### Ejemplo real

#### Línea de entrenamiento
- Calentamiento

#### Contenido
- Calentamiento de velocidad

#### Ejercicios del contenido
- 18 tareas / exercises

#### En una sesión
La sesión puede elegir:
- el contenido "Calentamiento de velocidad"
- pero seleccionar solo algunos ejercicios de ese contenido, por ejemplo:
  - ejercicio 1
  - ejercicio 3
  - ejercicio 7
  - ejercicio 12

Además puede agregar otro contenido:
- Juego aéreo básico
- y seleccionar 4 ejercicios de ese bloque

Esto permite una planeación mucho más realista para entrenadores de porteros.

---

## 🔐 Authentication Flow

- JWT access token (short life)
- Refresh token rotation
- Role Guards
- Tenant resolution via JWT payload

JWT Payload example:

```json
{
  "sub": "userId",
  "tenantId": "tenantId",
  "role": "COACH"
}
```

---

## 🌐 REST API Structure

### Auth

```http
POST /auth/register-tenant
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
```

### Users CRUD

```http
POST /users
GET /users
GET /users/:id
PATCH /users/:id
DELETE /users/:id
```

### Goalkeepers CRUD

```http
POST /goalkeepers
GET /goalkeepers
GET /goalkeepers/:id
PATCH /goalkeepers/:id
DELETE /goalkeepers/:id
GET /goalkeepers/:id/progress
GET /goalkeepers/:id/evaluations
GET /goalkeepers/:id/metrics
```

### Teams

```http
POST /teams
GET /teams
GET /teams/:id
PATCH /teams/:id
DELETE /teams/:id
POST /teams/:id/goalkeepers/:goalkeeperId
```

### Training Lines

```http
POST /training-lines
GET /training-lines
GET /training-lines/:id
PATCH /training-lines/:id
DELETE /training-lines/:id
```

### Training Contents

```http
POST /training-contents
GET /training-contents
GET /training-contents/:id
PATCH /training-contents/:id
DELETE /training-contents/:id
GET /training-lines/:id/contents
```

Filtros:
- trainingLineId
- level
- search

### Exercises

```http
POST /exercises
GET /exercises
GET /exercises/:id
PATCH /exercises/:id
DELETE /exercises/:id
GET /training-contents/:id/exercises
```

Filtros:
- trainingContentId
- difficulty
- search

### Training Sessions

```http
POST /training-sessions
GET /training-sessions
GET /training-sessions/:id
PATCH /training-sessions/:id
DELETE /training-sessions/:id
```

### Session Contents

```http
POST /training-sessions/:sessionId/contents
GET /training-sessions/:sessionId/contents
PATCH /training-sessions/:sessionId/contents/:sessionContentId
DELETE /training-sessions/:sessionId/contents/:sessionContentId
```

### Session Exercises

```http
POST /training-sessions/:sessionId/exercises
GET /training-sessions/:sessionId/exercises
PATCH /training-sessions/:sessionId/exercises/:sessionExerciseId
DELETE /training-sessions/:sessionId/exercises/:sessionExerciseId
```

### Attendance

```http
POST /attendance/bulk
GET /attendance/session/:sessionId
PATCH /attendance/:id
```

### Evaluations

```http
POST /evaluations
GET /evaluations
GET /evaluations/:id
PATCH /evaluations/:id
DELETE /evaluations/:id
```

### Metrics

```http
POST /metrics
GET /metrics
GET /metrics/:id
GET /metrics/goalkeeper/:id/timeline
```

### Billing SaaS

```http
GET /subscriptions/me
POST /subscriptions/checkout
POST /subscriptions/webhook
PATCH /subscriptions/cancel
```

---

## 🧾 Ejemplo de payload para crear una sesión completa

```json
{
  "title": "Sesión porteros sub17 - velocidad y blocaje",
  "date": "2026-03-12",
  "startTime": "2026-03-12T17:00:00.000Z",
  "endTime": "2026-03-12T18:30:00.000Z",
  "teamId": "team_123",
  "coachId": "coach_456",
  "contents": [
    {
      "trainingContentId": "content_calentamiento_velocidad",
      "order": 1,
      "customDurationMinutes": 15,
      "exercises": [
        {
          "exerciseId": "ex_1",
          "order": 1,
          "customRepetitions": 3
        },
        {
          "exerciseId": "ex_3",
          "order": 2,
          "customDurationMinutes": 2
        },
        {
          "exerciseId": "ex_7",
          "order": 3,
          "customRestSeconds": 20
        }
      ]
    },
    {
      "trainingContentId": "content_blocaje_frontal",
      "order": 2,
      "customDurationMinutes": 20,
      "exercises": [
        {
          "exerciseId": "ex_21",
          "order": 1
        },
        {
          "exerciseId": "ex_22",
          "order": 2
        }
      ]
    }
  ]
}
```

---

## 📊 SaaS Plans Logic

### FREE
- 1 coach
- 1 goalkeepers
- basic reports

### BASIC
- 3 coaches
- 50 goalkeepers
- evaluations

### PRO
- unlimited sessions
- advanced metrics
- dashboards

### ENTERPRISE
- multi-branch
- white label
- external API

---

## 📈 Core Differentiation (Goalkeeper Domain)

El sistema debe medir:

- Blocaje
- Reflejos
- Juego aéreo
- 1 vs 1
- Posicionamiento
- Perfilación corporal
- Juego con pies
- Distribución
- Velocidad de reacción
- Mentalidad competitiva

Esto define el valor comercial del producto.

---

## 🧠 Recommended Development Roadmap

### Phase 1 — MVP
- Auth
- Tenants
- Users
- Goalkeepers
- Coaches
- Teams
- TrainingLines
- TrainingContents
- Exercises
- TrainingSessions
- SessionContents
- SessionExercises
- Attendance
- Evaluations

### Phase 2 — SaaS monetization
- Subscriptions
- Plan limits
- Dashboard
- Reports

### Phase 3 — Premium product
- Advanced metrics
- Video analysis
- Notifications
- AI performance insights

---

## 🧪 API Response Standard

Success:

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "AUTH_ERROR"
}
```

---

## 🏗 Recommended Architecture

- Modular NestJS
- TYPEORM repository layer
- Guards for role + tenant
- DTO validation
- Soft deletes
- Audit logs
- Dockerized environment
- CI/CD ready

---

## 🚀 Target Outcome

Construir un **SaaS escalable para academias de porteros**
con capacidad de:

- vender licencias mensuales
- analizar rendimiento deportivo
- profesionalizar entrenamiento específico de porteros
- generar reportes técnicos automatizados

---
