# Reglas de Negocio - Sistema de Automatización de Nómina

Este documento formaliza las reglas de negocio implementadas en el **Motor de Liquidación de Nómina (Parte 2)** para la empresa financiera.

---

## 1. Cargos y Tarifas por Hora

Los empleados pertenecen a un cargo específico y tienen asignado un `valor_hora` individual fijado dentro de los límites estrictos del cargo:

| Cargo | Rango Valor Hora Permitido |
| :--- | :--- |
| **Gerente** | $100.000 a $110.000 COP / hora |
| **Administrador** | $50.000 a $60.000 COP / hora |
| **Operario** | $25.000 a $30.000 COP / hora |

*Regla:* El cálculo de la nómina utiliza exclusivamente el `valor_hora` real registrado en la ficha del empleado. No se genera de forma aleatoria ni se recalcula fuera de los límites.

---

## 2. Horas Trabajadas y Periodo

- **Periodo Obligatorio:** Formato estricto `YYYY-MM` (ejemplo: `2026-09`, `2026-10`).
- **Validaciones de Horas:**
  - Obligatorias y de tipo numérico.
  - Mayores estrictamente a 0 (`horas > 0`).
  - No se aceptan valores negativos ni texto.
  - Límite máximo razonable mensual: **300 horas**.
- **Entidad:** `horas_trabajadas` (ID, empleado_id, periodo, horas, created_at, updated_at).
- **Unicidad:** Cada empleado puede registrar sus horas para un periodo determinado. Existe una restricción única compuesta `(empleado_id, periodo)`.

---

## 3. Fórmulas del Motor de Liquidación

### 3.1. Salario Bruto
$$\text{Salario Bruto} = \text{Horas Trabajadas} \times \text{Valor Hora}$$

*Ejemplo:*
- Horas trabajadas: $176$
- Valor hora: $\$55.000$
- Salario bruto: $176 \times 55.000 = \$9.680.000$

### 3.2. Bono por Hijos
El bono por hijos se evalúa a partir del número de hijos registrados en el perfil del empleado bajo una escala fija de escalones:

| Número de Hijos | Valor del Bono Mensual |
| :---: | :---: |
| **0 hijos** | $\$0$ |
| **1 hijo** | $\$250.000$ |
| **2 hijos** | $\$400.000$ |
| **3 o más hijos** | $\$600.000$ |

*Regla de diseño:* Esta lógica reside en una única fuente de verdad en el servicio de negocio `calcularBonoPorHijos(numeroHijos: number)` y se reutiliza sin duplicación.

### 3.3. Deducción de Seguridad Social (Aporte a Salud / Pensión Académico)
$$\text{Seguridad Social} = \text{Salario Bruto} \times \left(\frac{\text{Porcentaje Configurado}}{100}\right)$$

*Parámetro Configurable:*
- Valor inicial / base académica: **4%** (`porcentaje = 4`).
- Almacenado de forma dinámica en la tabla `configuraciones_nomina` (clave `PORCENTAJE_SEGURIDAD_SOCIAL`).
- Puede modificarse en caliente mediante API sin alterar el código fuente ni las liquidaciones históricas.

*Ejemplo:*
- Salario bruto: $\$9.680.000$
- Porcentaje: $4\%$
- Deducción seguridad social: $9.680.000 \times 0.04 = \$387.200$

### 3.4. Salario Neto a Pagar
$$\text{Salario Neto} = \text{Salario Bruto} + \text{Bono por Hijos} - \text{Seguridad Social}$$

*Ejemplo:*
- Salario bruto: $\$9.680.000$
- Bono por hijos (2 hijos): $+\$400.000$
- Deducción seguridad social ($4\%$): $-\$387.200$
- **Salario neto resultante:** $\$9.680.000 + \$400.000 - \$387.200 = \$9.692.800$

---

## 4. Inmutabilidad y Auditoría Histórica

Una liquidación de nómina representa un registro legal contable. Por ello, la entidad `liquidaciones` almacena una instantánea (*snapshot*) completa e independiente de:
- `horas_trabajadas`
- `valor_hora`
- `numero_hijos`
- `cargo_nombre`
- `salario_bruto`
- `bono_hijos`
- `porcentaje_seguridad_social`
- `valor_seguridad_social`
- `salario_neto`
- `estado` (`CALCULADA` / `ANULADA` / `PENDIENTE`)
- `fecha_liquidacion`

**Garantía:** Si en meses posteriores un empleado es promovido, cambia su valor por hora, registra más hijos o se modifica la tasa de seguridad social global, las liquidaciones pasadas **conservan intactos sus valores originales**.

---

## 5. Prevención de Duplicados

No se permite duplicar liquidaciones para un mismo empleado en un mismo periodo:
- Validado a nivel de servicio de negocio.
- Validado y protegido a nivel de motor de base de datos PostgreSQL mediante el índice único compuesto:
  `CREATE UNIQUE INDEX "liquidaciones_empleado_id_periodo_key" ON "liquidaciones"("empleado_id", "periodo");`
- Si se intenta duplicar, la API responde con código HTTP `409 Conflict` y el mensaje:
  `"El empleado ya tiene una liquidación para este periodo."`

---

## 6. Flujo de Previsualización y Confirmación

Para evitar errores humanos:
1. El usuario selecciona Empleado, Periodo y Horas trabajadas.
2. Pulsa **Calcular Liquidación**: se ejecuta `POST /api/liquidaciones/calcular`. La respuesta genera la previsualización detallada **sin guardar en la base de datos**.
3. El usuario revisa minuciosamente el desglose de conceptos.
4. El usuario pulsa **Confirmar Liquidación**: se ejecuta `POST /api/liquidaciones`. El backend ejecuta la transacción atómica, recalcula todos los valores garantizando seguridad (sin confiar en montos enviados por el cliente) y persiste la liquidación en estado `CALCULADA`.

---

## 7. Alcance de Fases

- **Parte 1 (Completada):** Gestión de Empleados, Cargos, Rangos Salariales, CRUD, Persistencia PostgreSQL y React.
- **Parte 2 (Completada):** Motor de Liquidación, Registro de Horas, Salario Bruto, Bono por Hijos, Seguridad Social Configurable, Salario Neto, Historial, Detalle de Auditoría, Previsualización y Validaciones.
- **Parte 3 (Próxima etapa):** Generación de comprobantes PDF, envío por correo electrónico SMTP, notificaciones push, dashboard analítico y autenticación/roles.
