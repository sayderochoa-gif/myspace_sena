import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment';
import { errorHandler } from './middlewares/errorHandler';
import cargoRoutes from './routes/cargo.routes';
import empleadoRoutes from './routes/empleado.routes';
import { sendSuccess } from './utils/response';
import { NotFoundError } from './utils/errors';

export const app: Express = express();

// Middlewares de seguridad y observabilidad
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman o curl) o que coincidan con FRONTEND_URL
      if (!origin || origin === env.FRONTEND_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // En desarrollo somos flexibles pero con registro
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de verificación de salud (Health Check)
app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
    'Servicio de Nómina funcionando correctamente'
  );
});

// Rutas de la API
app.use('/api/cargos', cargoRoutes);
app.use('/api/empleados', empleadoRoutes);

// Ruta raíz con metadatos de la API
app.get('/', (_req: Request, res: Response) => {
  res.json({
    nombre: 'Sistema de Automatización de Nómina - API',
    version: '1.0.0 (Parte 1)',
    estado: 'Activo',
    endpoints: {
      health: 'GET /api/health',
      cargos: 'GET /api/cargos',
      cargoById: 'GET /api/cargos/:id',
      empleados: 'GET /api/empleados',
      empleadoById: 'GET /api/empleados/:id',
      crearEmpleado: 'POST /api/empleados',
      actualizarEmpleado: 'PUT /api/empleados/:id',
      desactivarEmpleado: 'DELETE /api/empleados/:id',
    },
  });
});

// Manejo de rutas inexistentes (404)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`La ruta solicitada [${req.method} ${req.originalUrl}] no existe`));
});

// Manejador centralizado de errores
app.use(errorHandler);
