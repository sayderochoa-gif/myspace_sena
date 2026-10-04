import { app } from './app';
import { env } from './config/environment';
import { disconnectPrisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log('🚀 SISTEMA DE NÓMINA - BACKEND ACTIVO');
  console.log(`🌐 Servidor escuchando en: http://localhost:${env.PORT}`);
  console.log(`📋 Entorno: ${env.NODE_ENV}`);
  console.log(`📡 URL Frontend configurada: ${env.FRONTEND_URL}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  console.log('====================================================');
});

// Manejo de apagado elegante (Graceful Shutdown)
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor de forma segura...`);
  server.close(async () => {
    console.log('🔒 Conexiones HTTP cerradas.');
    await disconnectPrisma();
    console.log('🗄️ Conexión con PostgreSQL cerrada.');
    process.exit(0);
  });

  // Forzar apagado después de 5 segundos si quedan conexiones colgadas
  setTimeout(() => {
    console.error('⚠️ Apagado forzado por tiempo límite.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
