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