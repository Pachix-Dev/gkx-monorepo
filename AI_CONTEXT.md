## 🧠 Recommended Development Roadmap

### Phase 1 — MVP
- Auth
- Tenants
- Users
- Goalkeepers
- Teams
- TrainingLines
- TrainingContents
- Exercises
- TrainingSessions
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
## 🚀 Target Outcome

Construir un **SaaS escalable para academias de porteros**
con capacidad de:

- vender licencias mensuales
- analizar rendimiento deportivo
- profesionalizar entrenamiento específico de porteros
- generar reportes técnicos automatizados

---

entidades NestJS modulos pendientes

🧾 Attendance

attendance_records
-------------------
id
tenant_id
training_session_id
goalkeeper_id
status   // PRESENT | ABSENT | LATE | JUSTIFIED
notes
recorded_by_user_id
recorded_at
created_at
updated_at

📊 Evaluations

evaluations
------------
id
tenant_id
training_session_id
goalkeeper_id
evaluated_by_user_id
evaluation_date
general_comment
overall_score
created_at
updated_at

evaluation_items
-----------------
id
evaluation_id
criterion_code
criterion_label
score
comment

## REGLAS PARA STRIPE Y SPEI
Stripe
upgrade: inmediato con prorrateo
downgrade: al final del periodo
cancelación: al final del periodo
renovación: automática por Stripe
SPEI
upgrade: inmediato solo después de aprobación manual
downgrade: al final del periodo
cancelación: al final del periodo
renovación: manual, contra validación de pago

Pregunta 1 — Stripe downgrade: acceso durante el periodo restante
Cuando un cliente solicita bajar de PRO → BASIC con Stripe:

Opción A: Mantiene acceso PRO hasta que venza el periodo actual, luego cobra BASIC en la siguiente renovación (requiere Subscription Schedules de Stripe o lógica adicional en webhooks)
Opción B: El precio baja de inmediato en Stripe (proration_behavior: 'none'), pero en nuestra DB seguimos mostrando PRO hasta que expire el periodo (más simple, puede haber desincronización temporal)


Pregunta 2 — Cancelación para tenants SPEI-only

Si un tenant paga solo por SPEI (sin stripeSubscriptionId), ¿cómo se cancela?

Opción A: El tenant hace clic en "Cancelar al final del periodo" → solo marcamos cancelAtPeriodEnd = true en la DB (sin llamar a Stripe, ya que no hay sub de Stripe). Al vencer el periodo, el SUPER_ADMIN simplemente no aprueba la renovación.
Opción B: Solo el SUPER_ADMIN puede marcar una suscripción SPEI como "no renovar".

Pregunta 3 — SPEI downgrade: ¿quién lo inicia?

Opción A: El tenant solicita el downgrade (ej. PRO→BASIC por SPEI) y queda como PENDING_REVIEW. El SUPER_ADMIN lo aprueba y el cambio queda pendiente hasta fin de periodo.
Opción B: Solo el SUPER_ADMIN lo programa directamente desde su panel, sin flujo de solicitud.
