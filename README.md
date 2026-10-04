# Sistema de Automatización de Nómina - Parte 1

Sistema integral de gestión de personal y automatización de nómina diseñado para empresas del sector financiero.

Este repositorio contiene la **Parte 1** del proyecto, enfocada en la creación de una arquitectura base sólida, configuración de persistencia en PostgreSQL con Prisma ORM, API REST completa con TypeScript y Express, y una interfaz de usuario moderna en React con Vite y Tailwind CSS.

---

## 1. ¿Qué es el proyecto?

El **Sistema de Automatización de Nómina** permite a una entidad financiera gestionar eficientemente su talento humano y parametrizar los cargos de la organización con sus respectivas bandas salariales.

En esta **Parte 1**, el sistema permite:
- Gestionar los cargos empresariales (**Gerente**, **Administrador**, **Operario**) con límites salariales estrictos por hora en pesos colombianos (COP).
- Registrar, consultar, buscar, editar y desactivar lógicamente empleados.
- Validar rigurosamente que la tarifa por hora asignada a cada empleado se encuentre dentro del rango estipulado para su cargo.
- Garantizar la unicidad del documento de identidad y correo electrónico.
- Ofrecer una experiencia de usuario responsiva, accesible y libre de errores.

---

## 2. Tecnologías Utilizadas

### Backend
- **Node.js**: Entorno de ejecución JavaScript del lado del servidor.
- **Express 4**: Framework web para la construcción de la API REST.
- **TypeScript**: Tipado estático para robustez y mantenibilidad del código.
- **Prisma ORM 5**: Mapeo relacional de objetos y gestión de migraciones y modelos.
- **Zod**: Validación de esquemas y sanitización de datos de entrada.
- **Helmet & CORS**: Seguridad HTTP y control de acceso cruzado entre dominios.
- **Morgan**: Registro estructurado de peticiones HTTP en consola.
- **Vitest & Supertest**: Suite de pruebas unitarias y de integración end-to-end.

### Frontend
- **React 18**: Biblioteca para la construcción de interfaces de usuario interactivas.
- **Vite 5**: Empaquetador de desarrollo ultrarrápido con Hot Module Replacement (HMR).
- **TypeScript**: Tipado estático en componentes, servicios y contratos de API.
- **Tailwind CSS 3**: Framework CSS utilitario para diseño moderno y responsivo.
- **Lucide React**: Conjunto consistente de iconografía vectorial.

### Base de Datos & Persistencia
- **PostgreSQL 16**: Base de datos relacional para almacenamiento ACID y alta integridad.
- **Tipos Decimales (`DECIMAL(12, 2)`)**: Precisión financiera exacta en montos monetarios.

### Despliegue & Contenedores
- **Docker & Docker Compose**: Configuración lista para despliegue contenerizado multiplataforma.

---

## 3. Requisitos del Sistema

- **Node.js**: Versión 18 LTS o superior (recomendado Node.js 20+).
- **npm**: Versión 9 o superior (incluido con Node.js).
- **PostgreSQL**: Versión 14 o superior (o Docker con contenedor de PostgreSQL).
- **Git**: Para clonación y control de versiones.

---

## 4. Cómo Instalar Node.js

### En Ubuntu / Debian:
```bash
# Mediante NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### En Arch Linux:
```bash
sudo pacman -S nodejs npm
```

### En macOS (Homebrew):
```bash
brew install node
```

### En Windows:
Descargue e instale el instalador LTS desde [nodejs.org](https://nodejs.org/).

Verifique la instalación:
```bash
node -v
npm -v
```

---

## 5. Cómo Instalar PostgreSQL

### En Ubuntu / Debian:
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### En Arch Linux:
```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

### Mediante Docker (Alternativa recomendada si ya dispone de Docker):
```bash
docker run --name nomina_postgres -e POSTGRES_USER=nomina_user -e POSTGRES_PASSWORD=nomina_password -e POSTGRES_DB=nomina_db -p 5432:5432 -d postgres:16-alpine
```

---

## 6. Cómo Crear la Base de Datos

Inicie sesión en la consola de PostgreSQL y cree la base de datos:

```bash
# Acceder a la consola con el usuario postgres
sudo -u postgres psql

# Dentro del prompt interactivo de PostgreSQL:
CREATE USER nomina_user WITH PASSWORD 'nomina_password_seguro';
CREATE DATABASE nomina_db OWNER nomina_user;
GRANT ALL PRIVILEGES ON DATABASE nomina_db TO nomina_user;
\q
```

---

## 7. Cómo Configurar las Variables de Entorno (.env)

El proyecto incluye plantillas `.env.example` en cada módulo.

### Backend (`backend/.env`):
Cree el archivo `backend/.env` copiando de `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` con sus credenciales de base de datos:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nomina_db?schema=public"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`):
Cree el archivo `frontend/.env` copiando de `frontend/.env.example`:
```bash
cp frontend/.env.example frontend/.env
```

Contenido de `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

---

## 8. Cómo Instalar Dependencias

Instale las dependencias tanto en el backend como en el frontend:

```bash
# 1. Dependencias del backend
cd backend
npm install

# 2. Dependencias del frontend
cd ../frontend
npm install
```

---

## 9. Cómo Ejecutar las Migraciones de Base de Datos

En el directorio `backend/`:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init_cargos_and_empleados
```

Esto creará automáticamente en PostgreSQL las tablas `cargos` y `empleados` con todas sus restricciones de integridad referencial y tipos decimales.

---

## 10. Cómo Ejecutar el Seed (Datos Iniciales)

Para poblar la base de datos con los 3 cargos institucionales y empleados de prueba:

```bash
cd backend
npm run prisma:seed
```

### Cargos sembrados:
1. **Gerente:** Rango permitido: **$100.000 - $110.000 COP**
2. **Administrador:** Rango permitido: **$50.000 - $60.000 COP**
3. **Operario:** Rango permitido: **$25.000 - $30.000 COP**

### Empleados de prueba iniciales:
- **Juan Pérez:** Documento `100000001`, Cargo `Administrador`, Tarifa `$55.000`, Hijos `2`.
- **María Gómez:** Documento `100000002`, Cargo `Gerente`, Tarifa `$105.000`, Hijos `1`.
- **Carlos Rodríguez:** Documento `100000003`, Cargo `Operario`, Tarifa `$28.000`, Hijos `0`.

---

## 11. Cómo Iniciar el Backend

En el directorio `backend/`:

```bash
cd backend
npm run dev
```

El servidor iniciará en: **`http://localhost:4000`**
Endpoint de salud disponible en: **`http://localhost:4000/api/health`**

---

## 12. Cómo Iniciar el Frontend

En una terminal independiente, en el directorio `frontend/`:

```bash
cd frontend
npm run dev
```

Abra su navegador web en: **`http://localhost:5173`**

---

## 13. Cómo Probar la API y Ejecutar las Pruebas Automatizadas

El backend incluye una suite completa de pruebas automatizadas con **Vitest** y **Supertest** que verifican los 16 casos de prueba solicitados:

```bash
cd backend
npm test
```

### Casos de prueba cubiertos:
1. Crear empleado correctamente con datos válidos.
2. Rechazar empleado con documento duplicado (código HTTP `409 Conflict`).
3. Rechazar empleado con correo inválido (código HTTP `400 Bad Request`).
4. Rechazar empleado sin nombre (código HTTP `400 Bad Request`).
5. Rechazar empleado sin apellido (código HTTP `400 Bad Request`).
6. Rechazar empleado sin cargo (código HTTP `400 Bad Request`).
7. Crear empleado con tarifa por hora válida dentro del rango del cargo.
8. Rechazar empleado con valor por hora inferior al mínimo del cargo (`HOURLY_RATE_OUT_OF_RANGE`).
9. Rechazar empleado con valor por hora superior al máximo del cargo (`HOURLY_RATE_OUT_OF_RANGE`).
10. Rechazar empleado con número de hijos negativo.
11. Consultar todos los empleados (`GET /api/empleados`).
12. Consultar empleado por ID (`GET /api/empleados/:id`).
13. Actualizar empleado respetando los rangos salariales (`PUT /api/empleados/:id`).
14. Desactivar lógicamente un empleado (`activo = false`).
15. Consultar los cargos disponibles (`GET /api/cargos`).
16. Verificar la relación íntegra entre empleado y cargo.

### Pruebas Rápidas con `curl`:

**Consultar Cargos:**
```bash
curl -s http://localhost:4000/api/cargos
```

**Consultar Empleados:**
```bash
curl -s http://localhost:4000/api/empleados
```

**Crear un Empleado Válido:**
```bash
curl -X POST http://localhost:4000/api/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Andrés",
    "apellido": "López",
    "documento": "100000005",
    "correo": "andres.lopez@empresa.com",
    "cargoId": 2,
    "valorHora": 54000,
    "numeroHijos": 1
  }'
```

**Probar Rechazo por Tarifa Fuera de Rango:**
```bash
curl -X POST http://localhost:4000/api/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Invalido",
    "apellido": "Sueldo",
    "documento": "100000006",
    "correo": "invalido@empresa.com",
    "cargoId": 2,
    "valorHora": 90000,
    "numeroHijos": 0
  }'
```
*Respuesta:* `400 Bad Request` con código `HOURLY_RATE_OUT_OF_RANGE`.

---

## 14. Estructura del Proyecto

```
sistema-nomina/
├── backend/
│   ├── prisma/
│   │   ├── migrations/             # Migraciones versionadas de SQL
│   │   ├── schema.prisma           # Esquema de datos Prisma (PostgreSQL)
│   │   └── seed.ts                 # Script de siembra inicial
│   ├── src/
│   │   ├── config/                 # Configuración de entorno y conexión Prisma
│   │   │   ├── environment.ts
│   │   │   └── prisma.ts
│   │   ├── controllers/            # Controladores de solicitudes HTTP
│   │   │   ├── cargo.controller.ts
│   │   │   └── empleado.controller.ts
│   │   ├── middlewares/            # Middlewares (manejo de errores, CORS)
│   │   │   └── errorHandler.ts
│   │   ├── routes/                 # Enrutadores REST de Express
│   │   │   ├── cargo.routes.ts
│   │   │   └── empleado.routes.ts
│   │   ├── services/               # Lógica de dominio y reglas de negocio
│   │   │   ├── cargo.service.ts
│   │   │   └── empleado.service.ts
│   │   ├── utils/                  # Formateadores, respuestas y errores personalizados
│   │   │   ├── errors.ts
│   │   │   ├── formatters.ts
│   │   │   └── response.ts
│   │   ├── validators/             # Esquemas de validación Zod
│   │   │   └── empleado.validator.ts
│   │   ├── app.ts                  # Configuración de Express
│   │   └── server.ts               # Arranque del servidor HTTP
│   ├── tests/                      # Suite de pruebas automatizadas
│   │   └── api.test.ts
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Componentes modulares de interfaz
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmployeeDetailModal.tsx
│   │   │   ├── EmployeeFormModal.tsx
│   │   │   ├── EmployeeTable.tsx
│   │   │   └── Navbar.tsx
│   │   ├── pages/                  # Vistas de la aplicación
│   │   │   └── EmployeesPage.tsx
│   │   ├── services/               # Consumo de la API REST
│   │   │   ├── api.ts
│   │   │   ├── cargoService.ts
│   │   │   └── empleadoService.ts
│   │   ├── types/                  # Definiciones e interfaces TypeScript
│   │   │   └── index.ts
│   │   ├── utils/                  # Formateadores (COP, fechas)
│   │   │   └── formatters.ts
│   │   ├── App.tsx                 # Contenedor raíz
│   │   ├── index.css               # Estilos globales y directivas Tailwind
│   │   ├── main.tsx                # Punto de montaje React
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── docs/                           # Documentación técnica complementaria
│   ├── api.md                      # Especificación completa de endpoints
│   └── architecture.md             # Diagramas arquitectónicos y decisiones
│
├── .gitignore                      # Exclusiones de Git (node_modules, .env, dist)
├── docker-compose.yml              # Orquestación de contenedores
└── README.md                       # Guía general del proyecto
```

---

## 15. Resumen de Endpoints Disponibles

| Método | Endpoint | Descripción | Códigos HTTP |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor | 200 |
| `GET` | `/api/cargos` | Listar cargos con rangos salariales | 200 |
| `GET` | `/api/cargos/:id` | Consultar cargo por ID | 200, 404 |
| `GET` | `/api/empleados` | Listar empleados (búsqueda y filtros) | 200 |
| `GET` | `/api/empleados/:id` | Consultar empleado por ID | 200, 404 |
| `POST` | `/api/empleados` | Crear empleado (validando rango y duplicados) | 201, 400, 409 |
| `PUT` | `/api/empleados/:id` | Actualizar empleado | 200, 400, 404, 409 |
| `DELETE` | `/api/empleados/:id` | Desactivar empleado (eliminación lógica) | 200, 404 |

---

## 16. Alcance Delimitado: Parte 1 vs. Próximas Etapas

### Implementado en esta etapa (Parte 1):
- [x] Estructura modular del proyecto y buenas prácticas fullstack.
- [x] Base de datos PostgreSQL con migraciones y modelos Prisma.
- [x] Precisión monetaria garantizada con tipos Decimal.
- [x] CRUD completo de Empleados y consulta de Cargos.
- [x] Validación estricta de límites salariales por cargo.
- [x] Manejo centralizado de errores y códigos de estado HTTP semánticos.
- [x] Frontend interactivo en React 18, TypeScript y Tailwind CSS con diseño profesional.
- [x] Suite de 16 pruebas automatizadas de integración aprobadas al 100%.

### Reservado estrictamente para la Parte 2 y posteriores:
- Motor de liquidación mensual de nómina.
- Cálculo de horas trabajadas y recargos.
- Deducciones de seguridad social y prestaciones legales.
- Cálculo de auxilio de transporte y bonos por hijos.
- Generación de volantes de pago en PDF.
- Envío de comprobantes por correo electrónico.
- Sistema de autenticación con JWT y control de acceso basado en roles (RBAC).
- Historial acumulado y reportes financieros.