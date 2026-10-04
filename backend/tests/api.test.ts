import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

describe('SISTEMA DE NÓMINA - PRUEBAS DE INTEGRACIÓN (PARTE 1)', () => {
  let gerenteCargoId: number;
  let adminCargoId: number;
  let operarioCargoId: number;
  let testEmployeeId: number;

  beforeAll(async () => {
    // Asegurar que existan los cargos base para las pruebas
    const cargos = await prisma.cargo.findMany();
    const gerente = cargos.find((c) => c.nombre === 'Gerente');
    const admin = cargos.find((c) => c.nombre === 'Administrador');
    const operario = cargos.find((c) => c.nombre === 'Operario');

    if (!gerente || !admin || !operario) {
      throw new Error('Los cargos deben estar inicializados para ejecutar las pruebas.');
    }

    gerenteCargoId = gerente.id;
    adminCargoId = admin.id;
    operarioCargoId = operario.id;

    // Limpiar posibles empleados de pruebas anteriores con documentos de prueba
    await prisma.empleado.deleteMany({
      where: {
        documento: {
          in: ['999000111', '999000222', '999000333', '999000444'],
        },
      },
    });
  });

  afterAll(async () => {
    // Limpieza posterior
    await prisma.empleado.deleteMany({
      where: {
        documento: {
          in: ['999000111', '999000222', '999000333', '999000444'],
        },
      },
    });
    await prisma.$disconnect();
  });

  // PRUEBA 15: Consultar cargos
  it('15. Debe consultar los cargos disponibles correctamente', async () => {
    const res = await request(app).get('/api/cargos');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const nombres = res.body.data.map((c: { nombre: string }) => c.nombre);
    expect(nombres).toContain('Gerente');
    expect(nombres).toContain('Administrador');
    expect(nombres).toContain('Operario');
  });

  // PRUEBA 1: Crear empleado correctamente
  it('1. Debe crear un empleado correctamente con datos válidos', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Pedro',
      apellido: 'Alvarado',
      documento: '999000111',
      correo: 'pedro.alvarado@empresa.com',
      cargoId: adminCargoId,
      valorHora: 55000,
      numeroHijos: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.documento).toBe('999000111');
    expect(res.body.data.valorHora).toBe(55000);
    expect(res.body.data.cargo.nombre).toBe('Administrador');
    expect(res.body.data.activo).toBe(true);

    testEmployeeId = res.body.data.id;
  });

  // PRUEBA 2: Crear empleado con documento duplicado
  it('2. Debe rechazar la creación de empleado con documento duplicado (409 Conflict)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Pedro Duplicado',
      apellido: 'Gómez',
      documento: '999000111', // Documento ya existente
      correo: 'pedro.otro@empresa.com',
      cargoId: adminCargoId,
      valorHora: 55000,
      numeroHijos: 0,
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('DUPLICATE_DOCUMENT');
  });

  // PRUEBA 3: Crear empleado con correo inválido
  it('3. Debe rechazar la creación de empleado con correo inválido (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Laura',
      apellido: 'Rivas',
      documento: '999000222',
      correo: 'correo_invalido_sin_arroba',
      cargoId: adminCargoId,
      valorHora: 55000,
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // PRUEBA 4: Crear empleado sin nombre
  it('4. Debe rechazar la creación de empleado sin nombre (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: '',
      apellido: 'Rivas',
      documento: '999000222',
      correo: 'laura.rivas@empresa.com',
      cargoId: adminCargoId,
      valorHora: 55000,
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // PRUEBA 5: Crear empleado sin apellido
  it('5. Debe rechazar la creación de empleado sin apellido (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Laura',
      apellido: '',
      documento: '999000222',
      correo: 'laura.rivas@empresa.com',
      cargoId: adminCargoId,
      valorHora: 55000,
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // PRUEBA 6: Crear empleado sin cargo
  it('6. Debe rechazar la creación de empleado sin cargo (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Laura',
      apellido: 'Rivas',
      documento: '999000222',
      correo: 'laura.rivas@empresa.com',
      valorHora: 55000,
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // PRUEBA 7: Crear empleado con valor hora válido
  it('7. Debe crear empleado con valor hora válido dentro del rango de Gerente', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Alejandro',
      apellido: 'Díaz',
      documento: '999000333',
      correo: 'alejandro.diaz@empresa.com',
      cargoId: gerenteCargoId,
      valorHora: 108000, // Válido: entre 100.000 y 110.000
      numeroHijos: 2,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valorHora).toBe(108000);
  });

  // PRUEBA 8: Crear empleado con valor hora inferior al mínimo
  it('8. Debe rechazar empleado con valor hora inferior al mínimo del cargo (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Santiago',
      apellido: 'Mora',
      documento: '999000444',
      correo: 'santiago.mora@empresa.com',
      cargoId: operarioCargoId, // Rango Operario: 25.000 a 30.000
      valorHora: 20000, // Inferior al mínimo permitido
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('HOURLY_RATE_OUT_OF_RANGE');
  });

  // PRUEBA 9: Crear empleado con valor hora superior al máximo
  it('9. Debe rechazar empleado con valor hora superior al máximo del cargo (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Santiago',
      apellido: 'Mora',
      documento: '999000444',
      correo: 'santiago.mora@empresa.com',
      cargoId: operarioCargoId, // Rango Operario: 25.000 a 30.000
      valorHora: 35000, // Superior al máximo permitido
      numeroHijos: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('HOURLY_RATE_OUT_OF_RANGE');
  });

  // PRUEBA 10: Crear empleado con número de hijos negativo
  it('10. Debe rechazar empleado con número de hijos negativo (400 Bad Request)', async () => {
    const res = await request(app).post('/api/empleados').send({
      nombre: 'Santiago',
      apellido: 'Mora',
      documento: '999000444',
      correo: 'santiago.mora@empresa.com',
      cargoId: operarioCargoId,
      valorHora: 28000,
      numeroHijos: -2, // Negativo no permitido
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // PRUEBA 11: Consultar empleados
  it('11. Debe consultar todos los empleados registrados', async () => {
    const res = await request(app).get('/api/empleados');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // PRUEBA 12: Consultar empleado por ID
  it('12. Debe consultar un empleado específico por su ID', async () => {
    const res = await request(app).get(`/api/empleados/${testEmployeeId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testEmployeeId);
    expect(res.body.data.documento).toBe('999000111');
  });

  // PRUEBA 13: Actualizar empleado
  it('13. Debe actualizar los datos de un empleado respetando rangos salariales', async () => {
    const res = await request(app)
      .put(`/api/empleados/${testEmployeeId}`)
      .send({
        nombre: 'Pedro Antonio',
        valorHora: 58000,
        numeroHijos: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe('Pedro Antonio');
    expect(res.body.data.valorHora).toBe(58000);
    expect(res.body.data.numeroHijos).toBe(3);
  });

  // PRUEBA 14: Desactivar empleado (eliminación lógica)
  it('14. Debe desactivar lógicamente un empleado (activo = false)', async () => {
    const res = await request(app).delete(`/api/empleados/${testEmployeeId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testEmployeeId);
    expect(res.body.data.activo).toBe(false);

    // Verificar en base de datos que sigue existiendo pero inactivo
    const checkDb = await prisma.empleado.findUnique({
      where: { id: testEmployeeId },
    });
    expect(checkDb).not.toBeNull();
    expect(checkDb?.activo).toBe(false);
  });

  // PRUEBA 16: Verificar relación empleado-cargo
  it('16. Debe retornar la relación completa empleado -> cargo con sus límites salariales', async () => {
    const res = await request(app).get(`/api/empleados/${testEmployeeId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cargo).toBeDefined();
    expect(res.body.data.cargo.id).toBe(adminCargoId);
    expect(res.body.data.cargo.nombre).toBe('Administrador');
    expect(res.body.data.cargo.valorHoraMinimo).toBe(50000);
    expect(res.body.data.cargo.valorHoraMaximo).toBe(60000);
  });
});
