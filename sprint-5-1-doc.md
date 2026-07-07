# Sprint 5.1 — AI Cost Guard, Rate Limiting y Observabilidad

---

## Especificación (prompt original)

La generación IA ya funciona.
Antes de seguir desarrollando nuevas funcionalidades quiero construir una capa completa de protección de costes, límites de uso y observabilidad.
Este sprint es obligatorio antes de abrir la beta privada.

**Objetivos**
- Evitar costes inesperados.
- Evitar abuso de la IA.
- Poder monitorizar el consumo.
- Preparar el sistema para futuros planes de pago.
- Mantener la arquitectura actual.

**NO añadir:**
- Marketplace
- Billing
- Stripe
- Nuevas capabilities
- Semantic Search
- Embeddings
- Multiagentes

---

### 1. Variables de entorno

Añade a `.env.example`:

```env
ANTHROPIC_API_KEY=

MAX_AI_GENERATIONS_PER_USER_DAY=10
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20
MAX_AI_GENERATIONS_GLOBAL_DAY=50

MAX_AI_ESTIMATED_COST_DAY_EUR=2

MAX_AI_PROMPT_LENGTH=2000
MAX_AI_SCHEMA_BYTES=50000
```

Todas deben tener documentación.

### 2. Base de datos

Crear una tabla para registrar cada llamada IA.

**AIUsage** debe contener:
- id
- userId
- workspaceId
- generationRequestId
- model
- promptCharacters
- inputTokens
- outputTokens
- totalTokens
- estimatedCostEUR
- durationMs
- status
- createdAt

El objetivo es tener histórico completo.

### 3. Servicio de cálculo de costes

Crear: `src/lib/ai-cost.ts`

Funciones:
- `estimateAnthropicCost()`
- `estimateGenerationCost()`
- `formatCost()`

El coste debe calcularse usando modelo utilizado, input tokens y output tokens. No hardcodear dentro del endpoint.

### 4. Servicio de límites

Crear: `src/lib/ai-rate-limit.ts`

Funciones:
- `getUserUsageToday()`
- `getWorkspaceUsageToday()`
- `getGlobalUsageToday()`
- `checkUserLimit()`
- `checkWorkspaceLimit()`
- `checkGlobalLimit()`
- `checkDailyCostLimit()`

Debe devolver: permitido, motivo, límite alcanzado.

### 5. Endpoint de generación

Modificar: `/api/generate-tool`

Antes de llamar a Anthropic, comprobar:
1. usuario autenticado
2. workspace pertenece a la organización
3. límite usuario
4. límite workspace
5. límite global
6. límite coste diario

Si cualquier límite falla: HTTP 429. Mensaje: "La generación IA está temporalmente deshabilitada porque se ha alcanzado el límite del entorno de pruebas." No llamar a Anthropic.

### 6. Registrar uso

Cada generación debe crear un registro en AIUsage. Guardar: modelo, tokens, duración, coste estimado, estado, usuario, workspace. Incluso cuando falle.

### 7. Dashboard de consumo

Crear: `/workspace/[workspaceId]/usage`

Mostrar hoy: generaciones realizadas, tokens entrada, tokens salida, tokens totales, coste estimado.

Límites con barra de progreso:
```
Usuario    ██████░░░░ 6/10
Workspace  ████░░░░░░ 8/20
Global     ██░░░░░░░░ 12/50
Coste      €0.42 / €2.00
```

### 8. Panel administrador

Solo visible para administradores. Permitir: reiniciar límites, borrar registros de prueba, exportar consumo CSV, ver últimos errores Anthropic.

### 9. Logging

Registrar: inicio generación, fin generación, duración, coste, errores, retries.
No guardar: API Key, datos sensibles.

### 10. UX

Si se alcanza un límite, mostrar mensaje claro:
"Has alcanzado el límite diario de generación IA del entorno de pruebas. Vuelve a intentarlo mañana o aumenta los límites del sistema."

Mostrar también generaciones restantes hoy.

### 11. Seguridad

Nunca exponer ANTHROPIC_API_KEY. Validar siempre workspace, usuario y ownership.

### 12. Rendimiento

No recalcular estadísticas continuamente. Usar consultas agregadas. Minimizar round-trips.

### 13. Testing

Probar: límite usuario, límite workspace, límite global, límite coste, error API Anthropic, timeout Anthropic, API Key ausente.

### 14. TypeScript

npm run type-check debe quedar 0 errores.

### 15. Informe final

Devuélveme:
1. Archivos creados.
2. Archivos modificados.
3. Esquema Prisma añadido.
4. Variables de entorno nuevas.
5. Cómo cambiar fácilmente los límites.
6. Cómo reiniciar estadísticas.
7. Cómo probar cada límite.
8. Cómo ver el coste acumulado.
9. Riesgos restantes.
10. Confirmación de type-check limpio.

Importante: Este sistema debe quedarse como la base definitiva de control de costes de ProTools Hub. En el futuro será reutilizado por Plan Free, Plan Pro, Plan Business y Plan Enterprise. Por tanto debe diseñarse pensando en producción, aunque inicialmente funcione únicamente como protección para el entorno de desarrollo y beta privada.

---

## Implementación entregada

### 1. Archivos creados

src/lib/ai-cost.ts — Cálculo de coste USD/EUR por modelo y tokens
src/lib/ai-rate-limit.ts — Comprobación de los 4 límites diarios
src/app/actions/ai-admin.ts — Server actions de admin: reset, export CSV, errores recientes
src/app/(dashboard)/workspace/[workspaceId]/usage/page.tsx — Dashboard de consumo IA
src/app/(dashboard)/workspace/[workspaceId]/usage/_components/AdminPanel.tsx — Panel admin (solo OWNER/ADMIN)

### 2. Archivos modificados

prisma/schema.prisma — Modelo AIUsage + relación aiUsages en User
src/app/api/generate-tool/route.ts — 4 límites antes de Anthropic + registro AIUsage + tokens input/output separados
src/app/(dashboard)/workspace/[workspaceId]/page.tsx — Botón "Uso IA" en la cabecera

### 3. Esquema Prisma añadido

model AIUsage {
  id                  String   @id @default(cuid())
  userId              String
  orgId               String
  workspaceId         String?
  generationRequestId String?
  model               String
  promptCharacters    Int      @default(0)
  inputTokens         Int      @default(0)
  outputTokens        Int      @default(0)
  totalTokens         Int      @default(0)
  estimatedCostEUR    Float    @default(0)
  durationMs          Int      @default(0)
  status              String   // 'success' | 'error' | 'rate_limited' | 'timeout'
  errorMessage        String?
  attempts            Int      @default(1)
  createdAt           DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, createdAt])
  @@index([orgId, createdAt])
  @@index([workspaceId, createdAt])
  @@index([createdAt])
  @@map("ai_usage")
}

Relación añadida en User:
  aiUsages AIUsage[]

### 4. Variables de entorno nuevas

Añadir a .env.local y .env.example manualmente (el hook de seguridad bloqueó la escritura automática):

MAX_AI_GENERATIONS_PER_USER_DAY=10
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=20
MAX_AI_GENERATIONS_GLOBAL_DAY=50
MAX_AI_ESTIMATED_COST_DAY_EUR=2
MAX_AI_PROMPT_LENGTH=2000
MAX_AI_SCHEMA_BYTES=50000

### 5. Cómo cambiar los límites

Edita .env.local y reinicia el servidor. No requiere cambios de código:

MAX_AI_GENERATIONS_PER_USER_DAY=25
MAX_AI_ESTIMATED_COST_DAY_EUR=5

### 6. Cómo reiniciar estadísticas

Via UI: Workspace → Uso IA → Panel de administración → Reiniciar contadores hoy
(requiere rol OWNER o ADMIN)

Via SQL:
DELETE FROM ai_usage WHERE created_at >= CURRENT_DATE;

### 7. Cómo probar cada límite

Pon el límite a 1 en .env.local, genera 2 veces. La 2ª devuelve HTTP 429.

MAX_AI_GENERATIONS_PER_USER_DAY=1      → límite de usuario
MAX_AI_GENERATIONS_PER_WORKSPACE_DAY=1 → límite de workspace
MAX_AI_GENERATIONS_GLOBAL_DAY=1        → límite global
MAX_AI_ESTIMATED_COST_DAY_EUR=0.0001   → límite de coste

### 8. Cómo ver el coste acumulado

- Dashboard: Workspace → Uso IA (coste de hoy en tiempo real)
- Admin → Exportar CSV: historial 30 días, una fila por llamada

SQL:
SELECT DATE(created_at) AS dia,
       COUNT(*) AS generaciones,
       SUM(estimated_cost_eur) AS coste_eur
FROM ai_usage
WHERE status != 'rate_limited'
GROUP BY 1
ORDER BY 1 DESC;

### 9. Riesgos restantes

- Tipo de cambio EUR/USD fijo (0.93): solo estimación, no facturación real
- recordUsage con void: si falla en producción no hay alerta visible — añadir Sentry/Datadog
- Contadores en PostgreSQL sin Redis: suficiente para beta; migrar si >100 rps
- Precios Anthropic hardcodeados en ai-cost.ts: actualizar si Anthropic cambia tarifas
- .env.example no actualizado automáticamente: añadir las vars manualmente

### 10. Type-check

> @protools/web@0.1.0 type-check
> tsc --noEmit

0 errores
