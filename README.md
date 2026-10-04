# Sistema de Automatización de Nómina - Parte 1 & Parte 2

Sistema integral de gestión de personal y automatización de nómina diseñado para empresas del sector financiero.

Este repositorio contiene la **Parte 1** (Gestión de Empleados, Cargos y Bandas Salariales) y la **Parte 2** (**Motor de Liquidación de Nómina**, Registro de Horas Trabajadas, Deducciones de Seguridad Social y Preservación Histórica e Inmutable).

---

## 1. ¿Qué es el proyecto?

El **Sistema de Automatización de Nómina** permite a una entidad financiera:
1. Gestionar eficientemente su talento humano y parametrizar los cargos de la organización con sus respectivas bandas salariales.
2. Registrar y controlar mensualmente las **horas trabajadas** por cada empleado asociadas a un periodo específico (`YYYY-MM`).
3. Calcular de forma automática, segura y precisa el **Salario Bruto**, el **Bono por Hijos**, el **Aporte a Seguridad Social** y el **Salario Neto**.
4. Ofrecer una **previsualización en tiempo real** previa a la confirmación para evitar errores humanos.
5. Evitar **liquidaciones duplicadas** para un mismo empleado en un mismo periodo (control a nivel de API y restricción única en PostgreSQL).
6. Consultar el **historial de liquidaciones** y el **detalle de auditoría**, garantizando la inmutabilidad histórica frente a cambios futuros en la ficha del empleado o en las tarifas de configuración.

---

## 2. Reglas de Negocio y Fórmulas del Motor de Liquidación (Parte 2)

### 2.1. Cargos y Tarifas por Hora
Los empleados tienen asignado un `valor_hora` individual fijado dentro de los límites del cargo:

| Cargo | Rango Valor Hora Permitido |
| :--- | :--- |
| **Gerente** | $100.000 a $110.000 COP / hora |
| **Administrador** | $50.000 a $60.000 COP / hora |
| **Operario** | $25.000 a $30.000 COP / hora |

*Nota:* El motor utiliza exclusivamente el `valor_hora` registrado para el empleado. No se calcula aleatoriamente.

### 2.2. Registro y Validación de Horas
- **Periodo Obligatorio:** Formato `YYYY-MM` (ejemplo: `2026-09`, `2026-10`).
- **Validaciones:**
  - Numéricas, estrictamente mayores a 0 (`horas > 0`).
  - No se aceptan números negativos ni texto.
  - Límite máximo razonable mensual: **300 horas**.
- **Entidad:** `horas_trabajadas` con índice único compuesto `(empleado_id, periodo)`.

### 2.3. Salario Bruto
$$\text{Salario Bruto} = \text{Horas Trabajadas} \times \text{Valor Hora}$$
*Ejemplo:* $176 \text{ horas} \times \$55.000 = \$9.680.000$ COP.

### 2.4. Bono por Hijos
Escala fija de incentivos familiares evaluada en una única fuente de verdad:
- **0 hijos:** $\$0$
- **1 hijo:** $\$250.000$
- **2 hijos:** $\$400.000$
- **3 o más hijos:** $\$600.000$

### 2.5. Deducción de Seguridad Social
$$\text{Seguridad Social} = \text{Salario Bruto} \times \left(\frac{\text{Porcentaje Configurado}}{100}\right)$$
- **Porcentaje Configurable:** Almacenado en la tabla `configuraciones_nomina` (clave `PORCENTAJE_SEGURIDAD_SOCIAL`).
- **Base académica inicial:** **4%** (`porcentaje = 4`).
- Se puede modificar dinámicamente mediante el endpoint `PUT /api/configuracion/seguridad-social`. Las nuevas liquidaciones usarán el nuevo valor, mientras las liquidaciones anteriores conservan intacto su porcentaje original.

### 2.6. Salario Neto
$$\text{Salario Neto} = \text{Salario Bruto} + \text{Bono por Hijos} - \text{Seguridad Social}$$
*Ejemplo (Caso Completo Juan Pérez, 176h, 2 hijos, 4%):*
- Salario Bruto: $\$9.680.000$
- Bono por Hijos: $+\$400.000$
- Seguridad Social: $-\$387.200$
- **Salario Neto a Pagar:** $\$9.692.800$ COP.

### 2.7. Auditoría e Inmutabilidad Histórica
La tabla `liquidaciones` almacena una instantánea (*snapshot*) de todos los valores al momento del cálculo:
- `valor_hora`
- `numero_hijos`
- `cargo_nombre`
- `porcentaje_seguridad_social`
- `horas_trabajadas`, `salario_bruto`, `bono_hijos`, `valor_seguridad_social`, `salario_neto`, `estado`, `fecha_liquidacion`.

Si en un mes posterior el empleado cambia de cargo, aumenta su tarifa o cambia su número de hijos, la liquidación histórica **no se modifica**.

---

## 3. Tecnologías Utilizadas

### Backend
- **Node.js 20+** & **TypeScript 5**
- **Express 4**: Framework web REST.
- **Prisma ORM 5**: Gestión de esquemas, migraciones y transacciones ACID en PostgreSQL.
- **Zod**: Validación estricta y sanitización de datos de entrada.
- **Vitest & Supertest**: Suite de 38 pruebas unitarias y de integración automáticas.
- **Helmet, CORS, Morgan**: Seguridad y observabilidad.

### Frontend
- **React 18** & **TypeScript 5**
- **Vite 5**: Empaquetador y entorno de desarrollo.
- **Tailwind CSS 3**: Diseño responsivo y modular.
- **Lucide React**: Iconografía consistente.

### Base de Datos
- **PostgreSQL 16**: Motor de persistencia relacional con precisión `DECIMAL`.

---

## 4. Estructura de la Base de Datos (Modelos Prisma)

```
Cargos (1) ──────────< (N) Empleados (1) ──────────< (N) HorasTrabajadas
                                (1) ──────────< (N) Liquidaciones

ConfiguracionNomina (Parámetros globales dinámicos)
```

- **`cargos`**: ID, nombre, valor_hora_minimo, valor_hora_maximo, activo.
- **`empleados`**: ID, nombre, apellido, documento (unique), correo (unique), cargo_id, valor_hora, numero_hijos, activo.
- **`horas_trabajadas`**: ID, empleado_id, periodo, horas, unique(empleado_id, periodo).
- **`liquidaciones`**: ID, empleado_id, periodo, horas_trabajadas, valor_hora, numero_hijos, cargo_nombre, salario_bruto, bono_hijos, porcentaje_seguridad_social, valor_seguridad_social, salario_neto, estado (`PENDIENTE`, `CALCULADA`, `ANULADA`), fecha_liquidacion, unique(empleado_id, periodo).
- **`configuraciones_nomina`**: ID, clave (unique), valor, descripcion.

---

## 5. Endpoints de la API REST

### Cargos
- `GET /api/cargos` - Listar cargos con límites salariales
- `GET /api/cargos/:id` - Consultar cargo por ID

### Empleados
- `GET /api/empleados` - Listar empleados (búsqueda y filtros)
- `GET /api/empleados/:id` - Consultar empleado por ID
- `POST /api/empleados` - Crear empleado (valida rango y duplicados)
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Desactivar empleado (soft delete)

### Horas Trabajadas (Parte 2)
- `GET /api/horas` - Consultar registros de horas (filtros: `?empleadoId=1&periodo=2026-09`)
- `GET /api/horas/:id` - Consultar registro específico de horas
- `POST /api/horas` - Registrar horas (`empleadoId`, `periodo`, `horas`)
- `PUT /api/horas/:id` - Actualizar registro de horas
- `DELETE /api/horas/:id` - Eliminar registro de horas

### Liquidación de Nómina (Parte 2)
- `POST /api/liquidaciones/calcular` - Previsualizar cálculo financiero sin guardar
- `POST /api/liquidaciones` - Confirmar y guardar liquidación (transaccional)
- `GET /api/liquidaciones` - Listar historial (filtros: `?empleadoId=1&periodo=2026-09&estado=CALCULADA`)
- `GET /api/liquidaciones/:id` - Consultar detalle inmutable y auditoría
- `PATCH /api/liquidaciones/:id/anular` - Anular una liquidación

### Configuración (Parte 2)
- `GET /api/configuracion/seguridad-social` - Consultar porcentaje actual
- `PUT /api/configuracion/seguridad-social` - Actualizar porcentaje global (`{ "porcentaje": 4 }`)

---

## 6. Cómo Ejecutar el Proyecto

### Paso 1: Levantar la Base de Datos PostgreSQL
Si utiliza Docker:
```bash
docker-compose up -d postgres
```
O verifique que PostgreSQL esté corriendo en el puerto `5432` con la base de datos `nomina_db`.

### Paso 2: Configurar y Ejecutar el Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```
El servidor backend se iniciará en `http://localhost:4000`.

### Paso 3: Configurar y Ejecutar el Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 7. Cómo Ejecutar las Pruebas Automatizadas

El backend cuenta con una suite completa de pruebas unitarias y de integración en Vitest que cubren el 100% de los requerimientos de la Parte 1 y Parte 2:

```bash
cd backend
npm test
```

### Pruebas Obligatorias Verificadas:
- [x] **PRUEBA 1:** 0 hijos $\rightarrow$ Bono = $\$0$
- [x] **PRUEBA 2:** 1 hijo $\rightarrow$ Bono = $\$250.000$
- [x] **PRUEBA 3:** 2 hijos $\rightarrow$ Bono = $\$400.000$
- [x] **PRUEBA 4:** 3 hijos $\rightarrow$ Bono = $\$600.000$
- [x] **PRUEBA 5:** 5 hijos $\rightarrow$ Bono = $\$600.000$
- [x] **PRUEBA 6:** 176 horas a $\$55.000$/hora $\rightarrow$ Salario Bruto = $\$9.680.000$
- [x] **PRUEBA 7:** Tarifa variable $\rightarrow$ Utiliza el valor real almacenado del empleado.
- [x] **PRUEBA 8:** Horas negativas ($-10$) $\rightarrow$ Rechazo con `400 Bad Request`.
- [x] **PRUEBA 9:** Horas superiores al límite ($301$ horas) $\rightarrow$ Rechazo con `400 Bad Request`.
- [x] **PRUEBA 10:** Liquidación duplicada en el mismo periodo $\rightarrow$ Rechazo con `409 Conflict` ("El empleado ya tiene una liquidación para este periodo.").
- [x] **PRUEBA 11:** Empleado inexistente $\rightarrow$ `404 Not Found`.
- [x] **PRUEBA 12:** Empleado inactivo $\rightarrow$ Impide liquidación con `400 Bad Request`.
- [x] **PRUEBA 13:** Cambio posterior de tarifa o hijos en el empleado $\rightarrow$ La liquidación histórica permanece idéntica.
- [x] **PRUEBA 14:** Modificación del porcentaje de seguridad social $\rightarrow$ Aplica a nuevas liquidaciones y preserva las pasadas.
- [x] **PRUEBA SEGURIDAD:** Intento de inyección de `salarioNeto` malicioso desde el cliente $\rightarrow$ Backend ignora y recalcula.
- [x] **CRUD HORAS:** Validaciones de formato `YYYY-MM`, creación, consulta, edición y eliminación.

**Total:** 38 pruebas automatizadas pasando exitosamente.

---

## 8. Cómo Probar una Liquidación Manualmente

### Opción A: A través de la Interfaz Web (Frontend)
1. Abra el navegador en `http://localhost:5173`.
2. En la barra superior, seleccione la pestaña **"Horas Trabajadas"**.
3. Haga clic en **"Registrar Horas"**, elija a `Juan Pérez`, periodo `2026-09` y digite `176` horas. Guarde el registro.
4. Vaya a la pestaña **"Liquidación de Nómina"** $\rightarrow$ **"Liquidar Nómina"**.
5. Seleccione a `Juan Pérez`, periodo `2026-09`. Haga clic en **"Cargar Horas"** (aparecerán automáticamente las 176 horas).
6. Presione **"Calcular Liquidación"**: Verá la previsualización completa:
   - Salario Bruto: $\$9.680.000$
   - Bono por Hijos: $\$400.000$
   - Seguridad Social ($4\%$): $\$387.200$
   - Salario Neto: $\$9.692.800$
7. Haga clic en **"Confirmar Liquidación"**: Se guardará la liquidación y se abrirá el **Comprobante de Auditoría**.
8. En la pestaña **"Historial de Liquidaciones"**, podrá consultar el registro guardado, filtrar por periodo o empleado, y ver el comprobante en cualquier momento.

### Opción B: A través de cURL / API REST
```bash
# 1. Previsualizar cálculo
curl -X POST http://localhost:4000/api/liquidaciones/calcular \
  -H "Content-Type: application/json" \
  -d '{"empleadoId": 1, "periodo": "2026-09", "horasTrabajadas": 176}'

# 2. Confirmar liquidación
curl -X POST http://localhost:4000/api/liquidaciones \
  -H "Content-Type: application/json" \
  -d '{"empleadoId": 1, "periodo": "2026-09", "horasTrabajadas": 176}'
```

---

## 9. Alcance Delimitado: Parte 2 vs. Parte 3

### Implementado en esta etapa (Parte 2):
- [x] Modelo relacional e índices compuestos para `horas_trabajadas` y `liquidaciones`.
- [x] Tabla y servicio de configuración dinámica de seguridad social.
- [x] Fórmulas matemáticas de salario bruto, bono por hijos escalonado, seguridad social y salario neto.
- [x] Endpoints CRUD completos para Horas Trabajadas y Liquidaciones.
- [x] Flujo de previsualización previa a la confirmación en Frontend y Backend.
- [x] Protección estricta contra liquidaciones duplicadas (409 Conflict).
- [x] Inmutabilidad histórica de auditoría (snapshot de parámetros).
- [x] Pestañas de navegación en React (Gestión de Empleados, Horas Trabajadas, Liquidación de Nómina).
- [x] 38 pruebas unitarias y de integración automatizadas.

### Reservado para la Parte 3 (No implementado en esta fase):
- Generación de comprobantes y volantes de pago en PDF.
- Envío automático de comprobantes por correo electrónico (SMTP / Nodemailer).
- Notificaciones push o al usuario.
- Dashboard analítico financiero avanzado con gráficos y métricas acumuladas.
- Autenticación mediante tokens JWT y control de acceso basado en roles (RBAC).
- Reportes contables avanzados.