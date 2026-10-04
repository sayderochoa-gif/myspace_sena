# Documentación de API REST - Sistema de Nómina (Parte 1)

Esta API proporciona los servicios base para la administración de cargos y empleados del Sistema de Automatización de Nómina.

**URL Base Local:** `http://localhost:4000/api`

---

## Formato Estándar de Respuestas

Todas las respuestas de la API siguen una estructura JSON homogénea y predecible:

### Respuesta Exitosa (200 / 201)
```json
{
  "success": true,
  "message": "Descripción de la operación exitosa",
  "data": { ... }
}
```

### Respuesta de Error (400 / 404 / 409 / 500)
```json
{
  "success": false,
  "message": "Descripción clara del motivo del fallo",
  "error": "CODIGO_DE_ERROR",
  "details": [ ... ]
}
```

---

## 1. Verificación de Salud (Health Check)

### `GET /health`
Verifica la disponibilidad y estado del servicio.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Servicio de Nómina funcionando correctamente",
  "data": {
    "status": "UP",
    "uptime": 120.45,
    "timestamp": "2026-10-04T17:50:00.000Z",
    "environment": "development"
  }
}
```

---

## 2. Endpoints de Cargos

### `GET /cargos`
Obtiene la lista de los cargos laborales configurados en la organización con sus rangos de valor por hora.

- **Parámetros de consulta (Query params):**
  - `all` (opcional, booleano): Si es `true`, incluye cargos inactivos. Por defecto solo retorna activos.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Cargos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Gerente",
      "valorHoraMinimo": 100000,
      "valorHoraMaximo": 110000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.510Z",
      "updatedAt": "2026-10-04T17:44:24.510Z"
    },
    {
      "id": 2,
      "nombre": "Administrador",
      "valorHoraMinimo": 50000,
      "valorHoraMaximo": 60000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.521Z",
      "updatedAt": "2026-10-04T17:44:24.521Z"
    },
    {
      "id": 3,
      "nombre": "Operario",
      "valorHoraMinimo": 25000,
      "valorHoraMaximo": 30000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.532Z",
      "updatedAt": "2026-10-04T17:44:24.532Z"
    }
  ]
}
```

### `GET /cargos/:id`
Obtiene la información de un cargo específico por su identificador numérico.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Cargo obtenido exitosamente",
  "data": {
    "id": 2,
    "nombre": "Administrador",
    "valorHoraMinimo": 50000,
    "valorHoraMaximo": 60000,
    "activo": true,
    "createdAt": "2026-10-04T17:44:24.521Z",
    "updatedAt": "2026-10-04T17:44:24.521Z"
  }
}
```

---

## 3. Endpoints de Empleados

### `GET /empleados`
Obtiene el listado de empleados registrados. Incluye la información del cargo asociado a cada empleado.

- **Parámetros de consulta (Query params):**
  - `search` (opcional, string): Búsqueda insensible a mayúsculas/minúsculas por coincidencia parcial en `nombre`, `apellido`, `documento` o `correo`.
  - `cargoId` (opcional, entero): Filtra empleados por el ID del cargo.
  - `activo` (opcional, string): `'true'` para solo activos, `'false'` para solo inactivos, `'all'` para todos.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Empleados obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "documento": "100000001",
      "correo": "juan.perez@empresa.com",
      "cargoId": 2,
      "cargo": {
        "id": 2,
        "nombre": "Administrador",
        "valorHoraMinimo": 50000,
        "valorHoraMaximo": 60000,
        "activo": true,
        "createdAt": "2026-10-04T17:44:24.521Z",
        "updatedAt": "2026-10-04T17:44:24.521Z"
      },
      "valorHora": 55000,
      "numeroHijos": 2,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.540Z",
      "updatedAt": "2026-10-04T17:44:24.540Z"
    }
  ]
}
```

### `GET /empleados/:id`
Obtiene un empleado específico por su ID.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Empleado obtenido exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "100000001",
    "correo": "juan.perez@empresa.com",
    "cargoId": 2,
    "cargo": {
      "id": 2,
      "nombre": "Administrador",
      "valorHoraMinimo": 50000,
      "valorHoraMaximo": 60000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.521Z",
      "updatedAt": "2026-10-04T17:44:24.521Z"
    },
    "valorHora": 55000,
    "numeroHijos": 2,
    "activo": true,
    "createdAt": "2026-10-04T17:44:24.540Z",
    "updatedAt": "2026-10-04T17:44:24.540Z"
  }
}
```

**Respuesta cuando no existe (404 Not Found):**
```json
{
  "success": false,
  "message": "El empleado con ID 99 no existe",
  "error": "EMPLOYEE_NOT_FOUND"
}
```

### `POST /empleados`
Registra un nuevo empleado en el sistema.

**Cuerpo de la Petición (JSON):**
```json
{
  "nombre": "Pedro",
  "apellido": "Alvarado",
  "documento": "100000004",
  "correo": "pedro.alvarado@empresa.com",
  "cargoId": 2,
  "valorHora": 55000,
  "numeroHijos": 1
}
```
*(Nota: La API también acepta `cargo_id`, `valor_hora` y `numero_hijos` en snake_case).*

**Validaciones Aplicadas:**
- `nombre`: Obligatorio, no vacío (1-100 caracteres).
- `apellido`: Obligatorio, no vacío (1-100 caracteres).
- `documento`: Obligatorio, no vacío, único en el sistema.
- `correo`: Obligatorio, formato de correo válido (`usuario@dominio.ext`), único en el sistema.
- `cargoId`: Obligatorio, debe corresponder a un cargo existente y activo.
- `valorHora`: Obligatorio, numérico, mayor a 0, y debe situarse estrictamente dentro del rango `[valorHoraMinimo, valorHoraMaximo]` del cargo correspondiente.
- `numeroHijos`: Entero mayor o igual a 0.

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Empleado creado correctamente",
  "data": {
    "id": 4,
    "nombre": "Pedro",
    "apellido": "Alvarado",
    "documento": "100000004",
    "correo": "pedro.alvarado@empresa.com",
    "cargoId": 2,
    "cargo": {
      "id": 2,
      "nombre": "Administrador",
      "valorHoraMinimo": 50000,
      "valorHoraMaximo": 60000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.521Z",
      "updatedAt": "2026-10-04T17:44:24.521Z"
    },
    "valorHora": 55000,
    "numeroHijos": 1,
    "activo": true,
    "createdAt": "2026-10-04T17:50:12.300Z",
    "updatedAt": "2026-10-04T17:50:12.300Z"
  }
}
```

**Ejemplos de Respuestas de Error:**

*Valor por hora fuera de rango (400 Bad Request):*
```json
{
  "success": false,
  "message": "El valor por hora ($70.000) debe estar entre $50.000 y $60.000 para el cargo de Administrador",
  "error": "HOURLY_RATE_OUT_OF_RANGE"
}
```

*Documento duplicado (409 Conflict):*
```json
{
  "success": false,
  "message": "El documento ya está registrado",
  "error": "DUPLICATE_DOCUMENT"
}
```

*Correo electrónico duplicado (409 Conflict):*
```json
{
  "success": false,
  "message": "El correo electrónico ya está registrado",
  "error": "DUPLICATE_EMAIL"
}
```

*Validación de campos faltantes o inválidos (400 Bad Request):*
```json
{
  "success": false,
  "message": "El nombre no puede estar vacío",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "campo": "nombre",
      "mensaje": "El nombre no puede estar vacío"
    }
  ]
}
```

### `PUT /empleados/:id`
Actualiza parcialmente o totalmente la información de un empleado existente. Si se modifica el cargo o el valor por hora, se revalida que el valor resultante respete los límites del cargo.

**Cuerpo de la Petición (JSON) - Campos Opcionales:**
```json
{
  "nombre": "Juan Carlos",
  "valorHora": 58000,
  "numeroHijos": 3
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Empleado actualizado correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Carlos",
    "apellido": "Pérez",
    "documento": "100000001",
    "correo": "juan.perez@empresa.com",
    "cargoId": 2,
    "cargo": {
      "id": 2,
      "nombre": "Administrador",
      "valorHoraMinimo": 50000,
      "valorHoraMaximo": 60000,
      "activo": true,
      "createdAt": "2026-10-04T17:44:24.521Z",
      "updatedAt": "2026-10-04T17:44:24.521Z"
    },
    "valorHora": 58000,
    "numeroHijos": 3,
    "activo": true,
    "createdAt": "2026-10-04T17:44:24.540Z",
    "updatedAt": "2026-10-04T17:55:00.000Z"
  }
}
```

### `DELETE /empleados/:id`
Ejecuta la eliminación lógica (soft delete) del empleado, estableciendo `activo = false`. El registro no se destruye de la base de datos para preservar la trazabilidad y el futuro histórico de nómina.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Empleado desactivado correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Carlos",
    "apellido": "Pérez",
    "documento": "100000001",
    "correo": "juan.perez@empresa.com",
    "cargoId": 2,
    "cargo": { ... },
    "valorHora": 58000,
    "numeroHijos": 3,
    "activo": false,
    "createdAt": "2026-10-04T17:44:24.540Z",
    "updatedAt": "2026-10-04T17:56:10.000Z"
  }
}
```

---

## 4. Endpoints de Horas Trabajadas (Parte 2)

### `GET /horas`
Consulta los registros mensuales de horas trabajadas.

- **Parámetros de consulta (Query params):**
  - `empleadoId`: Filtra por ID de empleado (ej. `?empleadoId=1`).
  - `periodo`: Filtra por periodo `YYYY-MM` (ej. `?periodo=2026-09`).

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Registros de horas obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "empleadoId": 1,
      "periodo": "2026-09",
      "horas": 176,
      "empleado": {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "documento": "100000001",
        "cargo": { "nombre": "Administrador" }
      },
      "createdAt": "2026-10-04T18:00:00.000Z",
      "updatedAt": "2026-10-04T18:00:00.000Z"
    }
  ]
}
```

### `GET /horas/:id`
Consulta un registro específico de horas por ID.

### `POST /horas`
Registra las horas trabajadas por un empleado en un periodo.

**Cuerpo de la petición (JSON):**
```json
{
  "empleadoId": 1,
  "periodo": "2026-09",
  "horas": 176
}
```

**Validaciones:**
- `empleadoId`: Obligatorio, numérico, empleado existente y activo.
- `periodo`: Obligatorio, formato estricto `YYYY-MM`.
- `horas`: Obligatorias, numéricas, mayor a 0 y menor o igual a 300.
- Unicidad: 409 si ya existen horas para ese empleado en el periodo.

### `PUT /horas/:id`
Actualiza un registro existente de horas trabajadas.

### `DELETE /horas/:id`
Elimina un registro de horas trabajadas.

---

## 5. Endpoints de Liquidación de Nómina (Parte 2)

### `POST /liquidaciones/calcular`
Genera la previsualización del cálculo financiero de liquidación sin persistir en la base de datos.

**Cuerpo de la petición (JSON):**
```json
{
  "empleadoId": 1,
  "periodo": "2026-09",
  "horasTrabajadas": 176
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Cálculo de liquidación generado exitosamente",
  "data": {
    "empleadoId": 1,
    "empleadoNombre": "Juan",
    "empleadoApellido": "Pérez",
    "empleadoDocumento": "100000001",
    "cargoNombre": "Administrador",
    "periodo": "2026-09",
    "horasTrabajadas": 176,
    "valorHora": 55000,
    "numeroHijos": 2,
    "salarioBruto": 9680000,
    "bonoHijos": 400000,
    "porcentajeSeguridadSocial": 4,
    "valorSeguridadSocial": 387200,
    "salarioNeto": 9692800
  }
}
```

### `POST /liquidaciones`
Confirma y almacena permanentemente la liquidación de nómina de forma transaccional.

**Cuerpo de la petición (JSON):**
```json
{
  "empleadoId": 1,
  "periodo": "2026-09",
  "horasTrabajadas": 176
}
```

*Nota de Seguridad:* Cualquier monto enviado por el cliente (`salarioNeto`, `salarioBruto`, etc.) es ignorado por completo. Todo se calcula en el backend.

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Liquidación registrada y guardada exitosamente",
  "data": {
    "id": 1,
    "empleadoId": 1,
    "periodo": "2026-09",
    "horasTrabajadas": 176,
    "valorHora": 55000,
    "numeroHijos": 2,
    "cargoNombre": "Administrador",
    "salarioBruto": 9680000,
    "bonoHijos": 400000,
    "porcentajeSeguridadSocial": 4,
    "valorSeguridadSocial": 387200,
    "salarioNeto": 9692800,
    "estado": "CALCULADA",
    "fechaLiquidacion": "2026-10-04T18:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400 Bad Request`: Horas o periodo inválidos, o empleado inactivo.
- `404 Not Found`: Empleado inexistente.
- `409 Conflict`: Si el empleado ya tiene una liquidación registrada para ese periodo (`"El empleado ya tiene una liquidación para este periodo."`).

### `GET /liquidaciones`
Consulta el historial de liquidaciones con filtros opcionales.
- `?empleadoId=1`
- `?periodo=2026-09`
- `?estado=CALCULADA`

### `GET /liquidaciones/:id`
Consulta el detalle inmutable y auditoría de una liquidación específica.

### `PATCH /liquidaciones/:id/anular`
Anula una liquidación cambiando su estado a `ANULADA`.

---

## 6. Endpoints de Configuración de Nómina

### `GET /configuracion/seguridad-social`
Obtiene el porcentaje actual de descuento para seguridad social.
```json
{
  "success": true,
  "message": "Configuración de seguridad social obtenida exitosamente",
  "data": {
    "porcentajeSeguridadSocial": 4
  }
}
```

### `PUT /configuracion/seguridad-social`
Actualiza el porcentaje de seguridad social para futuras liquidaciones (Solo ADMIN).
```json
{
  "porcentaje": 5
}
```

---

## 7. Endpoints de Autenticación & Sesión (Parte 3)

### `POST /auth/login`
Autenticación de usuario por correo y contraseña. Implementa rate limiting y protección contra ataques de enumeración.

**Body:**
```json
{
  "correo": "admin@financorp.com",
  "password": "NominaSegura2026!"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nombre": "Administrador Principal",
      "correo": "admin@financorp.com",
      "rol": "ADMIN",
      "empleadoId": null
    }
  }
}
```

### `POST /auth/logout`
Cierra la sesión del usuario.

### `GET /auth/me`
Obtiene el perfil del usuario autenticado a partir del token Bearer. Requiere cabecera `Authorization: Bearer <TOKEN>`.

---

## 8. Endpoints del Dashboard de Métricas

### `GET /dashboard/resumen`
Métricas consolidadas calculadas 100% en tiempo real desde PostgreSQL (ADMIN y RRHH).
- **Parámetro opcional:** `?periodo=YYYY-MM` (por defecto mes en curso).

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "empleados": { "total": 4, "activos": 3, "inactivos": 1 },
    "periodoSeleccionado": "2026-10",
    "liquidaciones": {
      "totalPeriodo": 3,
      "calculadas": 3,
      "anuladas": 0,
      "pendientes": 0,
      "totalBruto": 24500000,
      "totalBonos": 1000000,
      "totalSeguridadSocial": 980000,
      "totalNeto": 24520000
    },
    "notificaciones": {
      "total": 3,
      "enviados": 3,
      "pendientes": 0,
      "errores": 0
    },
    "ultimasLiquidaciones": [ ... ]
  }
}
```

---

## 9. Endpoints de Comprobantes PDF & Correo Electrónico

### `GET /liquidaciones/:id/pdf`
Descarga directa del comprobante oficial en formato PDF.
- Cabecera: `Content-Type: application/pdf`
- Cabecera: `Content-Disposition: attachment; filename="volante-NOM-YYYY-MM-XXXXXX.pdf"`

### `POST /liquidaciones/:id/enviar`
Reenvía el comprobante PDF adjunto al correo electrónico registrado del empleado (ADMIN y RRHH).

### `POST /liquidaciones/:id/anular`
Anula la liquidación registrando el motivo y fecha, regenerando el PDF con marca de agua oficial (ADMIN y RRHH).

**Body:**
```json
{
  "motivo": "Ajuste de horas por incapacidad médica del colaborador"
}
```

### `POST /notificaciones/:id/reintentar`
Reintenta el despacho de un correo electrónico en estado ERROR o PENDIENTE (ADMIN y RRHH).

---

## 10. Portal de Autoservicio del Empleado

Rutas privadas y estrictamente restringidas a los datos del colaborador autenticado (rol EMPLEADO):

### `GET /empleado/perfil`
Devuelve el perfil del empleado vinculado a la cuenta autenticada.

### `GET /empleado/liquidaciones`
Lista exclusivamente las liquidaciones correspondientes al empleado autenticado.

### `GET /empleado/liquidaciones/:id/pdf`
Descarga el comprobante PDF de una liquidación propia (rechaza con 403 Forbidden si el comprobante pertenece a otro empleado).

---

## 11. Pista de Auditoría Inmutable

### `GET /auditoria`
Consulta la bitácora completa de eventos del sistema (Solo ADMIN).
- Filtros opcionales: `?usuarioId=1`, `?accion=CREAR_LIQUIDACION`, `?entidad=LIQUIDACION`.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "usuarioId": 1,
      "accion": "CREAR_LIQUIDACION",
      "entidad": "LIQUIDACION",
      "entidadId": 4,
      "descripcion": "Liquidada nómina para Juan Pérez (2026-10) - Neto: $9.692.800",
      "ip": "127.0.0.1",
      "createdAt": "2026-10-04T19:30:00.000Z",
      "usuario": {
        "nombre": "Administrador Principal",
        "correo": "admin@financorp.com",
        "rol": "ADMIN"
      }
    }
  ]
}
```

---

## 12. Configuración Corporativa de la Empresa

### `GET /configuracion/empresa`
Obtiene los datos institucionales de la entidad financiera (razón social, NIT, dirección, teléfono, correo de nómina y sitio web).

### `PUT /configuracion/empresa`
Actualiza la información corporativa utilizada en el membrete del PDF y firmas de correo (Solo ADMIN).

