import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de la base de datos (seed)...');

  // 1. Sembrar Cargos iniciales
  const cargosData = [
    {
      nombre: 'Gerente',
      valorHoraMinimo: new Prisma.Decimal(100000),
      valorHoraMaximo: new Prisma.Decimal(110000),
      activo: true,
    },
    {
      nombre: 'Administrador',
      valorHoraMinimo: new Prisma.Decimal(50000),
      valorHoraMaximo: new Prisma.Decimal(60000),
      activo: true,
    },
    {
      nombre: 'Operario',
      valorHoraMinimo: new Prisma.Decimal(25000),
      valorHoraMaximo: new Prisma.Decimal(30000),
      activo: true,
    },
  ];

  const cargosMap = new Map<string, number>();

  for (const cargo of cargosData) {
    const upserted = await prisma.cargo.upsert({
      where: { nombre: cargo.nombre },
      update: {
        valorHoraMinimo: cargo.valorHoraMinimo,
        valorHoraMaximo: cargo.valorHoraMaximo,
        activo: cargo.activo,
      },
      create: cargo,
    });
    cargosMap.set(upserted.nombre, upserted.id);
    console.log(`✓ Cargo registrado: ${upserted.nombre} (ID: ${upserted.id}, Rango: $${upserted.valorHoraMinimo} - $${upserted.valorHoraMaximo})`);
  }

  // 2. Sembrar Empleados de prueba iniciales
  const empleadosData = [
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      documento: '100000001',
      correo: 'juan.perez@empresa.com',
      cargoNombre: 'Administrador',
      valorHora: new Prisma.Decimal(55000),
      numeroHijos: 2,
      activo: true,
    },
    {
      nombre: 'María',
      apellido: 'Gómez',
      documento: '100000002',
      correo: 'maria.gomez@empresa.com',
      cargoNombre: 'Gerente',
      valorHora: new Prisma.Decimal(105000),
      numeroHijos: 1,
      activo: true,
    },
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      documento: '100000003',
      correo: 'carlos.rodriguez@empresa.com',
      cargoNombre: 'Operario',
      valorHora: new Prisma.Decimal(28000),
      numeroHijos: 0,
      activo: true,
    },
  ];

  const empleadosMap = new Map<string, number>();

  for (const emp of empleadosData) {
    const cargoId = cargosMap.get(emp.cargoNombre);
    if (!cargoId) {
      throw new Error(`Cargo no encontrado para: ${emp.cargoNombre}`);
    }

    const upserted = await prisma.empleado.upsert({
      where: { documento: emp.documento },
      update: {
        nombre: emp.nombre,
        apellido: emp.apellido,
        correo: emp.correo,
        cargoId: cargoId,
        valorHora: emp.valorHora,
        numeroHijos: emp.numeroHijos,
        activo: emp.activo,
      },
      create: {
        nombre: emp.nombre,
        apellido: emp.apellido,
        documento: emp.documento,
        correo: emp.correo,
        cargoId: cargoId,
        valorHora: emp.valorHora,
        numeroHijos: emp.numeroHijos,
        activo: emp.activo,
      },
    });
    empleadosMap.set(upserted.correo, upserted.id);
    console.log(`✓ Empleado registrado: ${upserted.nombre} ${upserted.apellido} (${emp.cargoNombre}, Doc: ${upserted.documento}, Valor Hora: $${upserted.valorHora})`);
  }

  // 3. Sembrar Configuración inicial de Nómina (Parte 2)
  const configSeguridadSocial = await prisma.configuracionNomina.upsert({
    where: { clave: 'PORCENTAJE_SEGURIDAD_SOCIAL' },
    update: {},
    create: {
      clave: 'PORCENTAJE_SEGURIDAD_SOCIAL',
      valor: '4',
      descripcion: 'Porcentaje de descuento para aportes a seguridad social (versión académica)',
    },
  });
  console.log(`✓ Configuración registrada: ${configSeguridadSocial.clave} = ${configSeguridadSocial.valor}%`);

  // 4. Sembrar Configuración de Empresa (Parte 3)
  const primerConfigEmpresa = await prisma.configuracionEmpresa.findFirst();
  if (!primerConfigEmpresa) {
    await prisma.configuracionEmpresa.create({
      data: {
        nombre: 'FinanCorp S.A.',
        nit: '900.123.456-7',
        direccion: 'Calle 72 # 10-34, Bogotá, Colombia',
        telefono: '+57 (1) 745-0000',
        correo: 'nomina@financorp.com',
        sitioWeb: 'www.financorp.com',
      },
    });
    console.log('✓ Configuración corporativa registrada: FinanCorp S.A.');
  }

  // 5. Sembrar Usuarios con roles para autenticación (Parte 3)
  const passwordComunHash = await bcrypt.hash('NominaSegura2026!', 10);
  const juanEmpleadoId = empleadosMap.get('juan.perez@empresa.com');

  const usuariosData = [
    {
      nombre: 'Administrador del Sistema',
      correo: 'admin@financorp.com',
      passwordHash: passwordComunHash,
      rol: 'ADMIN' as const,
      activo: true,
    },
    {
      nombre: 'Analista de Recursos Humanos',
      correo: 'rrhh@financorp.com',
      passwordHash: passwordComunHash,
      rol: 'RRHH' as const,
      activo: true,
    },
    {
      nombre: 'Juan Pérez',
      correo: 'juan.perez@empresa.com',
      passwordHash: passwordComunHash,
      rol: 'EMPLEADO' as const,
      empleadoId: juanEmpleadoId,
      activo: true,
    },
  ];

  for (const usr of usuariosData) {
    const upsertedUsr = await prisma.usuario.upsert({
      where: { correo: usr.correo },
      update: {
        nombre: usr.nombre,
        rol: usr.rol,
        activo: usr.activo,
        empleadoId: usr.empleadoId,
      },
      create: usr,
    });
    console.log(`✓ Usuario registrado: ${upsertedUsr.nombre} (${upsertedUsr.correo}, Rol: ${upsertedUsr.rol})`);
  }

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
