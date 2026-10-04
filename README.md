# Sistema de Automatización de Nómina - Solución Integral (Partes 1, 2 y 3)

Sistema integral de liquidación y automatización de nómina desarrollado para el sector financiero con arquitectura desacoplada, alta seguridad, auditoría inmutable y experiencia de usuario moderna.

---

## 1. Resumen Ejecutivo del Proyecto

El **Sistema de Automatización de Nómina** es una solución Full Stack empresarial diseñada para procesar y auditar la nómina de colaboradores bajo estrictas políticas de negocio y normativas de seguridad:

1. **Gestión de Talento Humano y Cargos:** Administración de cargos organizacionales con bandas salariales mínimas y máximas, y fijación individual de tarifas por hora para cada colaborador.
2. **Control de Horas Laboradas:** Registro mensual de horas con validaciones estrictas y formato estándar `YYYY-MM`.
3. **Motor Matemático de Liquidación:**
   - Salario Bruto = $\text{Horas Trabajadas} \times \text{Valor Hora}$
   - Bono por Hijos (escala progresiva de incentivos familiares)
   - Deducción configurable de Seguridad Social (base académica 4%)
   - Salario Neto a consignar
   - Instantánea histórica inmutable (*snapshot*) que congela valores y previene alteraciones futuras.
4. **Seguridad y Control de Acceso RBAC:** Autenticación segura mediante tokens JWT, hashing de contraseñas con bcrypt, protección contra fuerza bruta y separación de roles (**ADMIN**, **RRHH**, **EMPLEADO**).
5. **Dashboard en Tiempo Real:** Métricas agregadas calculadas directamente en PostgreSQL (total empleados, activos, liquidaciones del periodo, montos consolidados y telemetría de correos).
6. **Volantes de Pago Oficiales en PDF:** Generación automática con membrete corporativo, identificador único estandarizado (`NOM-YYYY-MM-XXXXXX`), tablas detalladas y marca de anulación.
7. **Despacho y Reintento de Correos (SMTP):** Integración con Nodemailer, registro de estado (`PENDIENTE`, `ENVIADO`, `ERROR`) y desacoplamiento de fallos: la caída del servidor de correo no invalida ni bloquea la liquidación.
8. **Portal del Colaborador:** Acceso exclusivo y privado donde cada empleado solo puede consultar sus propios datos y descargar sus volantes oficiales.
9. **Pista de Auditoría Inmutable:** Registro detallado de accesos, creación de liquidaciones, anulaciones con motivo, generación de PDF y cambios en configuraciones.
10. **Anulación Controlada:** Posibilidad de invalidar comprobantes con motivo justificado y fecha sin borrado físico destructivo.

---

## 2. Credenciales de Acceso para Pruebas y Demostración

La base de datos cuenta con usuarios semilla listos para probar todos los roles del sistema:

| Rol | Correo Electrónico | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@financorp.com` | `NominaSegura2026!` | Control total: Empleados, Cargos, Horas, Liquidaciones, Dashboard, PDF, Correo, Parámetros y **Auditoría**. |
| **RRHH** | `rrhh@financorp.com` | `NominaSegura2026!` | Gestión de Empleados, Registro de Horas, Liquidación de Nómina, Descarga/Envío de PDF y Reintento de Correos. |
| **EMPLEADO** | `juan.perez@empresa.com` | `NominaSegura2026!` | Portal de autoservicio: Perfil personal, historial de sus propias liquidaciones y descarga de sus volantes PDF. |

*Nota:* La pantalla de Login incluye botones de acceso demo en 1 clic para facilitar la evaluación.

---

## 3. Arquitectura del Sistema

El sistema implementa una arquitectura modular por capas desacopladas:

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React + Vite + TS)              │
│  - Contexto de Autenticación (AuthContext & useAuth)            │
│  - Vistas: Dashboard, Empleados, Horas, Liquidaciones,          │
│    Portal del Colaborador, Pista de Auditoría                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API / JWT Bearer
┌───────────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Node.js + Express + TS)            │
│  - Middlewares: requireAuth, requireRole (RBAC), Rate Limit     │
│  - Servicios:                                                   │
│    • AuthService (JWT, bcrypt)                                  │
│    • LiquidacionService (Cálculos, Snapshot inmutable)          │
│    • PdfService (Generación PDFKit con membrete)                │
│    • EmailService (Nodemailer, telemetría y reintentos)         │
│    • AuditoriaService (Trazabilidad obligatoria)                │
│    • DashboardService (Agregaciones PostgreSQL en vivo)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Prisma ORM 5 (Transacciones ACID)
┌───────────────────────────────▼─────────────────────────────────┐
│                   BASE DE DATOS (PostgreSQL 16)                 │
│  - Tablas: usuarios, empleados, cargos, horas_trabajadas,       │
│    liquidaciones, notificaciones, configuracion_empresa,        │
│    configuraciones_nomina, auditorias                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Reglas del Motor de Liquidación de Nómina

### 4.1. Cargos y Tarifas por Hora
| Cargo | Rango Valor Hora Permitido |
| :--- | :--- |
| **Gerente** | $100.000 a $110.000 COP / hora |
| **Administrador** | $50.000 a $60.000 COP / hora |
| **Operario** | $25.000 a $30.000 COP / hora |

### 4.2. Salario Bruto
$$\text{Salario Bruto} = \text{Horas Trabajadas} \times \text{Valor Hora}$$
*Ejemplo:* $176 \text{ horas} \times \$55.000 = \$9.680.000$ COP.

### 4.3. Bono por Hijos
- **0 hijos:** $\$0$
- **1 hijo:** $\$250.000$
- **2 hijos:** $\$400.000$
- **3 o más hijos:** $\$600.000$

### 4.4. Deducción de Seguridad Social
$$\text{Seguridad Social} = \text{Salario Bruto} \times \left(\frac{\text{Porcentaje Configurado}}{100}\right)$$
- Porcentaje inicial: **4%**.
- Configurable dinámicamente desde la interfaz o API (`PUT /api/configuracion/seguridad-social`).

### 4.5. Salario Neto Total
$$\text{Salario Neto} = \text{Salario Bruto} + \text{Bono por Hijos} - \text{Seguridad Social}$$

*Ejemplo (Caso Completo Juan Pérez, 176h, $55.000/h, 2 hijos, 4%):*
- Salario Bruto: $\$9.680.000$
- Bono Familiar: $+\$400.000$
- Seguridad Social: $-\$387.200$
- **Neto a Consignar:** $\$9.692.800$ COP.

---

## 5. Volantes de Pago en PDF y Despacho de Correo

### 5.1. Comprobante Oficial en PDF
- **Identificador Único:** `NOM-YYYY-MM-XXXXXX` (ejemplo: `NOM-2026-10-000001`).
- **Diseño Corporativo:** Membrete con NIT, razón social y datos institucionales configurables.
- **Detalle:** Tabla de ingresos devengados, deducciones de ley y neto a consignar.
- **Marca de Anulación:** Si la liquidación es anulada, el PDF incluye una franja roja destacada con el motivo y fecha de invalidación.
- **Almacenamiento:** Persistido en disco (`backend/storage/pdfs/`).

### 5.2. Despacho Desacoplado de Correos (SMTP)
- Al confirmarse la liquidación, se despacha automáticamente el volante adjunto al correo del colaborador.
- Cada intento se registra en la tabla `notificaciones` con estado `ENVIADO`, `PENDIENTE` o `ERROR`.
- **Resiliencia:** Si el servidor SMTP no está disponible o rechaza el envío, la liquidación **permanece 100% válida con estado CALCULADA**, registrando el error en la notificación y permitiendo reintentar el despacho posteriormente.

---

## 6. Pista de Auditoría Inmutable

Todas las operaciones críticas son registradas con timestamp, ID de usuario responsable, acción, entidad afectada, descripción y dirección IP:
- `LOGIN`, `LOGIN_FALLIDO`, `LOGIN_BLOQUEADO`
- `CREAR_EMPLEADO`, `ACTUALIZAR_EMPLEADO`, `DESACTIVAR_EMPLEADO`
- `REGISTRAR_HORAS`, `ACTUALIZAR_HORAS`, `ELIMINAR_HORAS`
- `CREAR_LIQUIDACION`, `ANULAR_LIQUIDACION`
- `GENERAR_PDF`, `ENVIAR_CORREO`, `REINTENTAR_CORREO`
- `CONFIG_ACTUALIZADA`

Solo los usuarios con rol **ADMIN** tienen autorización para consultar la bitácora completa (`GET /api/auditoria`).

---

## 7. Despliegue y Ejecución Rápida

### 7.1. Opción 1: Despliegue con Docker Compose (Recomendado)

1. Clonar el repositorio y configurar variables de entorno:
```bash
cp .env.example .env
```

2. Construir y levantar todos los contenedores (PostgreSQL, Backend, Frontend):
```bash
docker-compose up -d --build
```

3. Aplicar migraciones y cargar datos semilla:
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

4. Abrir la aplicación en el navegador:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)

---

### 7.2. Opción 2: Ejecución Local en Desarrollo

#### Requisitos Previos:
- Node.js 20+
- PostgreSQL 16 corriendo en `localhost:5432` con usuario `nomina_user` o equivalente.

#### 1. Configurar Backend:
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

#### 2. Configurar Frontend:
```bash
cd frontend
npm install
npm run dev
```

Acceder en `http://localhost:5173`.

---

## 8. Verificación de Calidad y Pruebas Automáticas

El proyecto cuenta con una batería completa de **60 pruebas automatizadas** que validan la Parte 1, Parte 2 y Parte 3 sin regresiones:

```bash
cd backend
npm test
```

### Resumen de la Suite de Pruebas:
- **`tests/api.test.ts` (16 pruebas):** Validaciones de CRUD de empleados, rangos salariales por cargo, soft-delete y unicidad.
- **`tests/liquidacion.test.ts` (22 pruebas):** Cálculos de bonos por hijos (0, 1, 2, 3+), horas trabajadas (validaciones, límites 1-300h), caso completo Juan Pérez, inmutabilidad histórica y protección contra valores manipulados en frontend.
- **`tests/part3.test.ts` (22 pruebas):**
  - Autenticación segura (credenciales inválidas, anti-enumeración, token expirado/adulterado).
  - Control de Acceso RBAC (bloqueo a Empleado para ver otros datos o crear liquidaciones, bloqueo a RRHH para auditoría).
  - Creación de liquidación con comprobante `NOM-YYYY-MM-XXXXXX` y generación física de PDF en disco.
  - Descarga de PDF y telemetría de correo con reintentos.
  - Portal del colaborador con privacidad estricta.
  - Dashboard con métricas agregadas reales de PostgreSQL.
  - Anulación controlada con motivo y fecha.
  - Trazabilidad y auditoría inmutable.
  - Gestión institucional de la empresa.

---

## 9. Resumen de Endpoints Principales de la API

| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Autenticación con correo y contraseña. Retorna JWT. |
| `POST` | `/api/auth/logout` | Público | Cierre de sesión. |
| `GET` | `/api/auth/me` | Todos | Perfil del usuario autenticado. |
| `GET` | `/api/dashboard/resumen` | ADMIN, RRHH | Métricas consolidadas en tiempo real. |
| `GET` | `/api/empleados` | ADMIN, RRHH | Listar empleados con filtros. |
| `POST` | `/api/empleados` | ADMIN, RRHH | Crear nuevo empleado. |
| `POST` | `/api/horas` | ADMIN, RRHH | Registrar horas trabajadas. |
| `POST` | `/api/liquidaciones/calcular`| ADMIN, RRHH | Previsualización de liquidación sin persistir. |
| `POST` | `/api/liquidaciones` | ADMIN, RRHH | Liquidar nómina definitiva, genera PDF y envía correo. |
| `GET` | `/api/liquidaciones/:id/pdf` | Todos (privado) | Descargar comprobante oficial en PDF. |
| `POST` | `/api/liquidaciones/:id/enviar`| ADMIN, RRHH | Reenviar comprobante por correo electrónico. |
| `POST` | `/api/liquidaciones/:id/anular`| ADMIN, RRHH | Anular liquidación con justificación. |
| `GET` | `/api/empleado/perfil` | EMPLEADO | Perfil del colaborador autenticado. |
| `GET` | `/api/empleado/liquidaciones` | EMPLEADO | Historial exclusivo de sus liquidaciones. |
| `GET` | `/api/auditoria` | ADMIN | Consulta de la pista de auditoría inmutable. |
| `GET` | `/api/configuracion/empresa` | Todos | Datos institucionales de la empresa. |
| `PUT` | `/api/configuracion/empresa` | ADMIN | Actualizar datos corporativos de la empresa. |
| `PUT` | `/api/configuracion/seguridad-social` | ADMIN | Actualizar porcentaje de seguridad social. |

---

## 10. Conclusión y Entrega

La solución desarrollada cumple rigurosamente con los 16 objetivos fijados para la Parte 3, integrando armónicamente las funcionalidades desarrolladas en las etapas anteriores y garantizando la robustez técnica, matemática y de seguridad requerida en el sector financiero.