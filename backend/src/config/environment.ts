import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',

  // Autenticación JWT
  JWT_SECRET: process.env.JWT_SECRET || 'nomina_jwt_secret_super_seguro_2026_financorp',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  // Configuración SMTP para envío de correos
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'FinanCorp Nómina <nomina@financorp.com>',

  // Almacenamiento local de comprobantes PDF
  PDF_STORAGE_DIR: process.env.PDF_STORAGE_DIR || path.resolve(__dirname, '../../storage/pdfs'),
};

if (!env.DATABASE_URL) {
  console.warn('⚠️ ADVERTENCIA: DATABASE_URL no está definida en las variables de entorno.');
}
