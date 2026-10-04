import { PrismaClient } from '@prisma/client';
import { env } from './environment';

// Declaración global para evitar múltiples instancias de Prisma Client en desarrollo con recarga en caliente
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
