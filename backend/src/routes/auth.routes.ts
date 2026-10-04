import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { env } from '../config/environment';

const router = Router();

// Rate limiter estricto para protección contra ataques de fuerza bruta en login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // límite de 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test', // Omitir durante ejecución de tests
  message: {
    success: false,
    message: 'Demasiados intentos fallidos desde esta IP. Por favor intente más tarde.',
    error: 'TOO_MANY_REQUESTS',
  },
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// GET /api/auth/me
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));

export default router;
