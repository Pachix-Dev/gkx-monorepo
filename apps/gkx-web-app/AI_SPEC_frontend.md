# AI_SPEC.md
## GKX Frontend Specification
### Next.js SaaS Frontend for Goalkeeper Training Management

---

## 1. Product Goal

Build the frontend of **GKX**, a SaaS platform for the integral management of goalkeeper training.

The frontend will be built with **Next.js** and will consume the existing NestJS REST API.

The app must support:

- authentication
- tenant-aware SaaS experience
- role-based dashboards
- CRUD interfaces for all core resources
- training planning workflows
- goalkeeper progress and evaluation views
- clean, scalable admin UX

---

## 2. Recommended Frontend Stack

### Core
- Next.js 15+ with App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Lucide icons

### Data & Forms
- TanStack Query
- React Hook Form
- Zod

### State
- Zustand for UI state only
- TanStack Query for server state

### Tables / UI
- TanStack Table
- Recharts for dashboards
- Sonner or React Hot Toast for notifications

### Auth / Infra
- JWT auth with access token + refresh token
- httpOnly cookies preferred if backend supports it
- otherwise in-memory access token + refresh strategy
- Axios or Fetch wrapper with interceptors

---

## 3. Application Type

This frontend is a **multi-tenant SaaS admin application**.

The primary experience is a dashboard for:

- tenant admins
- coaches
- assistant coaches
- super admins
- read-only users

Secondary experiences may later exist for:

- parents
- goalkeepers

---

## 4. Roles to Support in UI

The API supports these roles:

- SUPER_ADMIN
- TENANT_ADMIN
- COACH
- ASSISTANT_COACH
- GOALKEEPER
- PARENT
- READONLY

### Frontend behavior by role

#### SUPER_ADMIN
- can access tenants
- can access users globally
- can manage platform-wide resources if allowed

#### TENANT_ADMIN
- can manage tenant users, coaches, teams, goalkeepers, sessions, lines, contents, exercises, attendance, evaluations

#### COACH
- can manage training sessions
- can assign contents and exercises
- can register attendance
- can create evaluations
- can view goalkeeper progress

#### ASSISTANT_COACH
- similar to coach but possibly more limited

#### READONLY
- can view data but not create/update/delete

#### GOALKEEPER / PARENT
- reserved for future portal experience

---

## 5. API Base Configuration

The frontend must use the provided REST API.

### API Base URL
Use environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Base path
All endpoints are under:

```txt
/api
```

### Example full URL
```txt
http://localhost:3001/api/training-lines
```

---

## 6. Authentication Model

The API has these auth endpoints:

- POST `/api/auth/register-tenant`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Frontend auth requirements

The frontend must implement:

1. Login page
2. Session persistence
3. Token refresh flow
4. Protected routes
5. Role-aware navigation
6. Logout

### Auth flow

#### Login
Send credentials to:

```http
POST /api/auth/login
```

Body:
```json
{
  "email": "coach@gkacademy.com",
  "password": "StrongPass123"
}
```

#### Current user
After login, request:

```http
GET /api/auth/me
```

Use this to:
- hydrate current user
- detect role
- detect tenant
- build sidebar and access rules

#### Refresh token
Use:

```http
POST /api/auth/refresh
```

#### Logout
Use:

```http
POST /api/auth/logout
```

### Recommended frontend auth architecture

- `AuthProvider`
- `useAuth()` hook
- route guards
- middleware for protected areas
- query cache invalidation on logout

---

## 7. Route Structure (Next.js App Router)

Recommended structure:

```txt
app/
  (public)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx
    dashboard/page.tsx
    users/page.tsx
    users/[id]/page.tsx
    tenants/page.tsx
    tenants/[id]/page.tsx
    goalkeepers/page.tsx
    goalkeepers/[id]/page.tsx
    coaches/page.tsx
    coaches/[id]/page.tsx
    teams/page.tsx
    teams/[id]/page.tsx
    training-lines/page.tsx
    training-lines/[id]/page.tsx
    training-contents/page.tsx
    training-contents/[id]/page.tsx
    exercises/page.tsx
    exercises/[id]/page.tsx
    training-sessions/page.tsx
    training-sessions/[id]/page.tsx
    attendance/page.tsx
    evaluations/page.tsx
    settings/page.tsx
```

---

## 8. Main Navigation

Sidebar proposal:

- Dashboard
- Goalkeepers
- Coaches
- Teams
- Training Lines
- Training Contents
- Exercises
- Training Sessions
- Attendance
- Evaluations
- Users
- Tenants
- Settings

### Role-aware visibility

#### Tenant Admin / Coach
Hide:
- Tenants
- global admin sections

#### Super Admin
Show:
- Tenants
- Users
- system-level visibility

---

## 9. Core UI Modules

### 9.1 Dashboard
Purpose:
- show top-level KPIs
- quick access to daily training workflow
- summarize goalkeepers, teams, sessions, evaluations

Widgets:
- total goalkeepers
- total coaches
- total teams
- sessions this week
- latest evaluations
- goalkeeper progress summary

---

### 9.2 Users
API:
- POST `/api/users`
- GET `/api/users`
- GET `/api/users/{id}`
- PATCH `/api/users/{id}`
- DELETE `/api/users/{id}`

UI requirements:
- list table
- create form
- edit form
- delete confirmation
- filters by role and status
- search by name/email if backend later supports it

Main columns:
- fullName
- email
- role
- status

---

### 9.3 Tenants
API:
- POST `/api/tenants`
- GET `/api/tenants`
- GET `/api/tenants/{id}`
- PATCH `/api/tenants/{id}`
- DELETE `/api/tenants/{id}`

UI requirements:
- super admin only
- list and detail views
- tenant status and plan display

Main columns:
- name
- slug
- plan
- status

---

### 9.4 Goalkeepers
API:
- POST `/api/goalkeepers`
- GET `/api/goalkeepers`
- GET `/api/goalkeepers/{id}`
- PATCH `/api/goalkeepers/{id}`
- DELETE `/api/goalkeepers/{id}`
- GET `/api/goalkeepers/{id}/progress`
- GET `/api/goalkeepers/{id}/evaluations`
- GET `/api/goalkeepers/{id}/metrics`

UI requirements:
- list page
- create/edit goalkeeper profile
- detail page with tabs:
  - profile
  - progress
  - evaluations
  - metrics

Main fields:
- category
- dominantHand
- dominantFoot
- height
- weight
- teamId
- medicalNotes
- parentContact

---

### 9.5 Coaches
API:
- POST `/api/coaches`
- GET `/api/coaches`
- GET `/api/coaches/{id}`
- PATCH `/api/coaches/{id}`
- DELETE `/api/coaches/{id}`

UI requirements:
- list and CRUD
- connect coach to user
- display specialty and license

Main fields:
- specialty
- licenseLevel
- experienceYears

---

### 9.6 Teams
API:
- POST `/api/teams`
- GET `/api/teams`
- GET `/api/teams/{id}`
- PATCH `/api/teams/{id}`
- DELETE `/api/teams/{id}`
- POST `/api/teams/{id}/goalkeepers/{goalkeeperId}`

UI requirements:
- list teams
- team detail
- assign goalkeepers to team
- show linked coach

Main fields:
- name
- category
- season
- coachId

---

### 9.7 Training Lines
API:
- POST `/api/training-lines`
- GET `/api/training-lines`
- GET `/api/training-lines/{id}`
- PATCH `/api/training-lines/{id}`
- DELETE `/api/training-lines/{id}`

UI requirements:
- visual list or cards
- color and icon support
- order display
- status management

Main fields:
- name
- description
- color
- icon
- order
- status

Example:
- Calentamiento
- Reacción
- Juego aéreo
- Blocaje
- Distribución

---

### 9.8 Training Contents
API:
- POST `/api/training-contents`
- GET `/api/training-contents`
- GET `/api/training-contents/{id}`
- PATCH `/api/training-contents/{id}`
- DELETE `/api/training-contents/{id}`
- GET `/api/training-lines/{id}/contents`

Query params:
- `trainingLineId`
- `level`
- `search`

UI requirements:
- list page with filters
- nested view by training line
- content detail page
- display number of linked exercises

Main fields:
- trainingLineId
- name
- description
- objective
- level
- estimatedDurationMinutes
- createdBy
- status

Example:
- Calentamiento de velocidad
- Activación coordinativa
- Blocaje frontal básico

---

### 9.9 Exercises
API:
- POST `/api/exercises`
- GET `/api/exercises`
- GET `/api/exercises/{id}`
- PATCH `/api/exercises/{id}`
- DELETE `/api/exercises/{id}`
- GET `/api/training-contents/{id}/exercises`

Query params:
- `trainingContentId`
- `difficulty`
- `search`

UI requirements:
- table or card grid
- filter by training content
- filter by difficulty
- detail view with instructions and media
- order management within content

Main fields:
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

---

### 9.10 Training Sessions
API:
- POST `/api/training-sessions`
- GET `/api/training-sessions`
- GET `/api/training-sessions/{id}`
- PATCH `/api/training-sessions/{id}`
- DELETE `/api/training-sessions/{id}`

UI requirements:
- session list
- create session page
- edit session page
- detail page
- session builder workflow

Main fields:
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

Status values:
- DRAFT
- PLANNED
- COMPLETED
- CANCELLED

---

### 9.11 Session Contents
API:
- POST `/api/session-contents`
- GET `/api/session-contents`
- GET `/api/session-contents/{id}`
- PATCH `/api/session-contents/{id}`
- DELETE `/api/session-contents/{id}`

Nested API:
- POST `/api/training-sessions/{sessionId}/contents`
- GET `/api/training-sessions/{sessionId}/contents`
- PATCH `/api/training-sessions/{sessionId}/contents/{sessionContentId}`
- DELETE `/api/training-sessions/{sessionId}/contents/{sessionContentId}`

UI requirements:
- session detail must show selected contents
- drag-and-drop order
- custom duration
- notes per block

Main fields:
- trainingContentId
- order
- notes
- customDurationMinutes

---

### 9.12 Session Exercises
API:
- POST `/api/session-exercises`
- GET `/api/session-exercises`
- GET `/api/session-exercises/{id}`
- PATCH `/api/session-exercises/{id}`
- DELETE `/api/session-exercises/{id}`

Nested API:
- POST `/api/training-sessions/{sessionId}/exercises`
- GET `/api/training-sessions/{sessionId}/exercises`
- PATCH `/api/training-sessions/{sessionId}/exercises/{sessionExerciseId}`
- DELETE `/api/training-sessions/{sessionId}/exercises/{sessionExerciseId}`

UI requirements:
- inside session detail, allow selecting exercises from chosen contents
- adjust repetitions, duration, rest and notes
- order exercises
- toggle selected state

Main fields:
- sessionContentId
- exerciseId
- order
- selected
- customDurationMinutes
- customRepetitions
- customRestSeconds
- coachNotes

---

### 9.13 Attendance
API:
- POST `/api/attendance`
- GET `/api/attendance`
- POST `/api/attendance/bulk`
- GET `/api/attendance/session/{sessionId}`
- GET `/api/attendance/{id}`
- PATCH `/api/attendance/{id}`
- DELETE `/api/attendance/{id}`

UI requirements:
- bulk attendance form from session detail
- quick attendance statuses
- attendance history per session

Status values:
- PRESENT
- ABSENT
- LATE
- JUSTIFIED

---

### 9.14 Evaluations
API:
- POST `/api/evaluations`
- GET `/api/evaluations`
- GET `/api/evaluations/{id}`
- PATCH `/api/evaluations/{id}`
- DELETE `/api/evaluations/{id}`

UI requirements:
- evaluation list
- evaluation form
- goalkeeper evaluation history
- numeric score inputs 0 to 10
- overall score display

Main fields:
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

## 10. Critical UX Flow: Session Builder

This is one of the most important frontend features.

### Objective
A coach should be able to create a training session using this logic:

```txt
Training Line -> Training Content -> Exercise
Training Session -> Session Content -> Session Exercise
```

### Recommended UI flow

#### Step 1
Create the training session:
- title
- date
- schedule
- coach
- team
- location
- notes

#### Step 2
Choose one or more training contents for the session.

Possible UX:
- select training line first
- then select training content inside that line

#### Step 3
Display available exercises for each selected content.

#### Step 4
Allow coach to choose only specific exercises.

#### Step 5
Allow session-specific customization:
- order
- custom duration
- repetitions
- rest
- notes

### Recommended screen structure

#### Left sidebar
- training lines
- content filters

#### Main area
- selected contents and their exercises

#### Right panel
- session summary
- total duration
- save actions

---

## 11. Recommended UI Components

Create reusable components for:

- `PageHeader`
- `DataTable`
- `EntityFormDialog`
- `DeleteConfirmDialog`
- `StatusBadge`
- `RoleBadge`
- `EmptyState`
- `FilterBar`
- `SearchInput`
- `MetricCard`
- `TabsSection`
- `SessionBuilder`
- `TrainingLineCard`
- `TrainingContentCard`
- `ExerciseCard`
- `AttendanceTable`
- `EvaluationForm`

---

## 12. Query Keys Proposal

Use TanStack Query keys like:

```ts
['me']
['users']
['users', id]
['tenants']
['tenants', id]
['goalkeepers']
['goalkeepers', id]
['goalkeepers', id, 'progress']
['goalkeepers', id, 'evaluations']
['goalkeepers', id, 'metrics']
['coaches']
['coaches', id]
['teams']
['teams', id]
['training-lines']
['training-lines', id]
['training-contents', filters]
['training-contents', id]
['training-lines', id, 'contents']
['exercises', filters]
['exercises', id]
['training-contents', id, 'exercises']
['training-sessions']
['training-sessions', id]
['training-sessions', sessionId, 'contents']
['training-sessions', sessionId, 'exercises']
['attendance']
['attendance', id]
['attendance', 'session', sessionId]
['evaluations']
['evaluations', id]
```

---

## 13. API Client Architecture

Recommended structure:

```txt
src/
  lib/
    api/
      client.ts
      auth.ts
      users.ts
      tenants.ts
      goalkeepers.ts
      coaches.ts
      teams.ts
      training-lines.ts
      training-contents.ts
      exercises.ts
      training-sessions.ts
      session-contents.ts
      session-exercises.ts
      attendance.ts
      evaluations.ts
```

### Recommendation
Use one central HTTP client with:
- base URL
- bearer token support
- automatic refresh handling
- common error normalization

---

## 14. Suggested Types

Create frontend types aligned with the API.

Key entities:

- `User`
- `Tenant`
- `Goalkeeper`
- `Coach`
- `Team`
- `TrainingLine`
- `TrainingContent`
- `Exercise`
- `TrainingSession`
- `SessionContent`
- `SessionExercise`
- `Attendance`
- `Evaluation`

Also create enums:

- `UserRole`
- `EntityStatus`
- `SessionStatus`
- `AttendanceStatus`

---

## 15. Form Strategy

Use:
- React Hook Form
- Zod schemas per resource
- mutation hooks with optimistic UI where appropriate

### Important
Although some update DTOs appear empty in the OpenAPI, the frontend should still support edit forms based on existing create fields, but with optional inputs.

---

## 16. Recommended Pages by Resource

### Dashboard
- overview cards
- latest sessions
- latest evaluations
- quick actions

### Users
- `/users`
- `/users/[id]`

### Tenants
- `/tenants`
- `/tenants/[id]`

### Goalkeepers
- `/goalkeepers`
- `/goalkeepers/[id]`

### Coaches
- `/coaches`
- `/coaches/[id]`

### Teams
- `/teams`
- `/teams/[id]`

### Training Lines
- `/training-lines`
- `/training-lines/[id]`

### Training Contents
- `/training-contents`
- `/training-contents/[id]`

### Exercises
- `/exercises`
- `/exercises/[id]`

### Training Sessions
- `/training-sessions`
- `/training-sessions/[id]`

### Attendance
- `/attendance`

### Evaluations
- `/evaluations`
- `/evaluations/[id]`

---

## 17. Design Direction

The interface should feel:

- modern
- sporty
- technical
- data-driven
- clean for coaches in operational environments

### Suggested visual style
- dark or neutral sidebar
- clean cards
- strong spacing
- status colors
- line/content/exercise hierarchy clearly visible

### Suggested accent areas
- goalkeeper performance cards
- training line colors
- session status badges

---

## 18. Error Handling

The frontend must handle:

- expired token
- forbidden role access
- validation errors
- missing entities
- empty datasets
- network failures

### Required UX
- toast notifications
- inline form validation
- full-page empty states
- loading skeletons

---

## 19. MVP Priorities

Build in this order:

### Phase 1
- auth
- dashboard shell
- users
- goalkeepers
- teams

### Phase 2
- training lines
- training contents
- exercises

### Phase 3
- training sessions
- session contents
- session exercises
- attendance

### Phase 4
- evaluations
- goalkeeper detail pages
- progress views

### Phase 5
- tenant management
- advanced reports
- polish

---

## 20. Frontend Folder Proposal

```txt
src/
  app/
  components/
    ui/
    layout/
    tables/
    forms/
    dashboard/
    training/
    goalkeepers/
  features/
    auth/
    users/
    tenants/
    goalkeepers/
    coaches/
    teams/
    training-lines/
    training-contents/
    exercises/
    training-sessions/
    attendance/
    evaluations/
  lib/
    api/
    auth/
    utils/
  hooks/
  stores/
  types/
  schemas/
  constants/
```

---

## 21. Notes for AI or Generator Agents

The frontend generator should understand:

1. This is a multi-page SaaS dashboard in Next.js.
2. The API is REST-based and already implemented.
3. The most important business workflow is the session builder:
   - training lines
   - training contents
   - exercises
   - sessions
   - session contents
   - session exercises
4. Role-based access is required.
5. All CRUD sections should be scaffolded with good UX patterns.
6. Goalkeeper detail pages must aggregate progress, evaluations and metrics.
7. Query parameters exist for training contents and exercises and should be wired to filter UI.
8. Attendance must support bulk registration by session.
9. Evaluation forms require numeric inputs from 0 to 10 for most technical attributes.

---

## 22. Final Objective

Build a professional **Next.js SaaS dashboard** for goalkeeper training operations that allows academies and coaches to:

- manage users and teams
- structure training methodology
- create and run sessions
- assign contents and exercises
- track attendance
- evaluate goalkeeper performance
- scale as a real SaaS product

---

---

## 23. Design System – Brand Colors

The application must use a **semantic color system** based on the GKX brand palette.

### Brand Colors

Primary:
- #C7F703

Secondary:
- #C3DA4B

Neutral Dark:
- #000000

Neutral Light:
- #FFFFFF

---

### Semantic Usage Rules

The frontend must NOT hardcode hex colors directly in components.

Instead, it must use semantic tokens such as:

- primary
- primary-foreground
- secondary
- background
- foreground
- card
- border
- muted

---

### Light Theme Tokens

- background: #FFFFFF  
- foreground: #000000  
- primary: #C7F703  
- primary-foreground: #000000  
- secondary: #C3DA4B  
- secondary-foreground: #000000  
- card: #FFFFFF  
- card-foreground: #000000  
- border: #E5E7EB  
- muted: #F5F5F5  
- muted-foreground: #525252  

---

### Dark Theme Tokens (future ready)

- background: #000000  
- foreground: #FFFFFF  
- primary: #C7F703  
- primary-foreground: #000000  
- secondary: #C3DA4B  
- secondary-foreground: #000000  
- card: #111111  
- card-foreground: #FFFFFF  
- border: #2A2A2A  
- muted: #1A1A1A  
- muted-foreground: #B3B3B3  

---

### UX Color Guidelines

Primary color (#C7F703) must be used for:

- main CTA buttons  
- active navigation items  
- selected states  
- KPI highlights  
- progress indicators  

Secondary color (#C3DA4B) must be used for:

- hover states  
- soft badges  
- secondary buttons  
- subtle highlights  

Black (#000000) must be used for:

- main text  
- dark sidebar background  
- strong icons  
- headings  

White (#FFFFFF) must be used for:

- main app background  
- cards  
- content surfaces  
- text on dark backgrounds  

---

### Accessibility Rules

- Never use white text on primary or secondary green backgrounds.  
- Always use black text on green surfaces.  
- Maintain high contrast for readability in sports environments and outdoor usage.  
- Prefer neutral backgrounds with accent color usage limited to ~20% of the UI.  

---

### Layout Color Strategy

Recommended distribution:

- Sidebar → black background + white text + primary active state  
- Header → white background  
- Cards → white with subtle borders  
- Primary buttons → primary background + black text  
- Status badges → primary or secondary depending on importance  

---

## 24. Next.js Engineering Rules and Best Practices

The frontend must follow modern **Next.js App Router best practices**.

### Rendering Strategy

- Use **Server Components by default**.
- Only use **Client Components** when interactivity is required:
  - forms
  - local state
  - event handlers
  - modals
  - drag and drop
  - browser-only APIs
  - TanStack Query hooks/providers

- Avoid marking entire pages as `use client` unless strictly necessary.
- Keep the client boundary as small as possible.

### Data Fetching

- Prefer fetching initial page data in **Server Components** when possible.
- Use **TanStack Query** for client-side server state, caching, mutations and invalidation.
- Do not use Zustand for remote API state.
- Use Zustand only for UI state.

### API Integration

- Use the existing NestJS REST API as the single backend source of truth.
- Centralize API calls in a dedicated API client layer.
- Do not hardcode backend responses.
- Do not invent fields or endpoints outside the OpenAPI contract.

### Forms and Validation

- Use **React Hook Form** for forms.
- Use **Zod** for validation schemas.
- Reuse create/edit forms whenever possible.
- If update DTOs are empty in OpenAPI, reuse create DTO fields as optional for edit forms.

### TypeScript Standards

- Use strict TypeScript.
- Avoid `any`.
- Create reusable types aligned with the API schemas.
- Prefer small, well-typed interfaces and utility types.

### State Management

- Use **TanStack Query** for server state.
- Use **Zustand** only for local UI state such as:
  - sidebar state
  - dialogs
  - local filters
  - session builder local interactions
  - board/editor state

### UI and Component Design

- Prefer reusable components over duplicated code.
- Keep presentational components simple and focused.
- Move business logic into hooks, feature modules, and API helpers.
- Build shared primitives for:
  - tables
  - forms
  - dialogs
  - badges
  - cards
  - page headers

### UX Requirements

Every data-driven screen must support:
- loading state
- error state
- empty state
- success state

All forms must provide:
- inline validation
- disabled submit while pending
- success and error feedback

### Performance

- Minimize client-side rendering.
- Lazy load heavy interactive components when appropriate.
- Avoid unnecessary rerenders.
- Use pagination, filters, and search patterns for large datasets.

### Accessibility

- Use semantic HTML.
- Use accessible labels for all form fields.
- Ensure keyboard navigation works for dialogs, menus and forms.
- Maintain visible focus states.
- Respect contrast and readability rules from the design system.

### Code Quality

- Prefer feature-based folder organization.
- Keep files small and cohesive.
- Avoid giant page components with mixed concerns.
- Write code that is easy to extend for SaaS growth.

### Server Actions

- Do not force Server Actions for all mutations.
- Since this project already uses a REST API, prefer API client calls for mutations.
- Use Server Actions only when they provide a clear advantage.
