import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';
import { liquidacionService } from '../src/services/liquidacion.service';
import { configuracionService } from '../src/services/configuracion.service';

describe('MOTOR DE LIQUIDACIÓN DE NÓMINA - PRUEBAS OBLIGATORIAS (PARTE 2)', () => {
  let empleadoJuanId: number;
  let empleadoMariaId: number;
  let empleadoCarlosId: number;
  let empleadoInactivoId: number;

  beforeAll(async () => {
    // Asegurar que exista configuración inicial de seguridad social al 4%
    await configuracionService.setPorcentajeSeguridadSocial(4);

    // Obtener los IDs de los empleados sembrados
    const juan = await prisma.empleado.findUnique({ where: { documento: '100000001' } });
    const maria = await prisma.empleado.findUnique({ where: { documento: '100000002' } });
    const carlos = await prisma.empleado.findUnique({ where: { documento: '100000003' } });

    if (!juan || !maria || !carlos) {
      throw new Error('Empleados de prueba no encontrados en la base de datos');
    }

    empleadoJuanId = juan.id;
    empleadoMariaId = maria.id;
    empleadoCarlosId = carlos.id;

    // Crear un empleado inactivo específico para pruebas
    const inactivo = await prisma.empleado.upsert({
      where: { documento: '999999999' },
      update: { activo: false },
      create: {
        nombre: 'Pedro',
        apellido: 'Inactivo',
        documento: '999999999',
        correo: 'pedro.inactivo@empresa.com',
        cargoId: carlos.cargoId,
        valorHora: 26000,
        numeroHijos: 1,
        activo: false,
      },
    });
    empleadoInactivoId = inactivo.id;

    // Limpiar liquidaciones y horas de prueba previa para evitar conflictos
    await prisma.liquidacion.deleteMany({
      where: {
        empleadoId: { in: [empleadoJuanId, empleadoMariaId, empleadoCarlosId, empleadoInactivoId] },
      },
    });
    await prisma.horasTrabajadas.deleteMany({
      where: {
        empleadoId: { in: [empleadoJuanId, empleadoMariaId, empleadoCarlosId, empleadoInactivoId] },
      },
    });
  });

  afterAll(async () => {
    // Restaurar porcentaje a 4%
    await configuracionService.setPorcentajeSeguridadSocial(4);
  });

  // -------------------------------------------------------------
  // PRUEBA 1: 0 hijos -> Bono = $0
  // -------------------------------------------------------------
  it('PRUEBA 1: 0 hijos debe generar Bono = $0', () => {
    const bono = liquidacionService.calcularBonoPorHijos(0);
    expect(bono).toBe(0);
  });

  // -------------------------------------------------------------
  // PRUEBA 2: 1 hijo -> Bono = $250.000
  // -------------------------------------------------------------
  it('PRUEBA 2: 1 hijo debe generar Bono = $250.000', () => {
    const bono = liquidacionService.calcularBonoPorHijos(1);
    expect(bono).toBe(250000);
  });

  // -------------------------------------------------------------
  // PRUEBA 3: 2 hijos -> Bono = $400.000
  // -------------------------------------------------------------
  it('PRUEBA 3: 2 hijos debe generar Bono = $400.000', () => {
    const bono = liquidacionService.calcularBonoPorHijos(2);
    expect(bono).toBe(400000);
  });

  // -------------------------------------------------------------
  // PRUEBA 4: 3 hijos -> Bono = $600.000
  // -------------------------------------------------------------
  it('PRUEBA 4: 3 hijos debe generar Bono = $600.000', () => {
    const bono = liquidacionService.calcularBonoPorHijos(3);
    expect(bono).toBe(600000);
  });

  // -------------------------------------------------------------
  // PRUEBA 5: 5 hijos -> Bono = $600.000
  // -------------------------------------------------------------
  it('PRUEBA 5: 5 hijos (3 o más) debe generar Bono = $600.000', () => {
    const bono = liquidacionService.calcularBonoPorHijos(5);
    expect(bono).toBe(600000);
  });

  // -------------------------------------------------------------
  // PRUEBA 6: 176 horas * $55.000/hora -> Salario Bruto = $9.680.000
  // -------------------------------------------------------------
  it('PRUEBA 6: 176 horas a $55.000/hora debe generar Salario Bruto = $9.680.000', () => {
    const salarioBruto = liquidacionService.calcularSalarioBruto(176, 55000);
    expect(salarioBruto).toBe(9680000);
  });

  // -------------------------------------------------------------
  // PRUEBA 7: Valor hora diferente -> Utilizar el valor real almacenado
  // -------------------------------------------------------------
  it('PRUEBA 7: Debe utilizar el valor real almacenado del empleado ($105.000 para María Gómez)', async () => {
    const res = await request(app)
      .post('/api/liquidaciones/calcular')
      .send({
        empleadoId: empleadoMariaId,
        periodo: '2026-09',
        horasTrabajadas: 160,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valorHora).toBe(105000);
    expect(res.body.data.salarioBruto).toBe(160 * 105000); // 16.800.000
    expect(res.body.data.bonoHijos).toBe(250000); // 1 hijo
  });

  // -------------------------------------------------------------
  // PRUEBA 8: Horas negativas -> Debe fallar (400)
  // -------------------------------------------------------------
  it('PRUEBA 8: Horas negativas (-10) debe fallar con 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoJuanId,
        periodo: '2026-09',
        horasTrabajadas: -10,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // -------------------------------------------------------------
  // PRUEBA 9: 301 horas -> Debe fallar (400)
  // -------------------------------------------------------------
  it('PRUEBA 9: 301 horas debe fallar con 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoJuanId,
        periodo: '2026-09',
        horasTrabajadas: 301,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // -------------------------------------------------------------
  // CASO COMPLETO DE PRUEBA (Sección 30)
  // -------------------------------------------------------------
  it('CASO COMPLETO (Sección 30): Juan Pérez, Admin, $55.000, 2 hijos, 2026-09, 176h, 4%', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoJuanId,
        periodo: '2026-09',
        horasTrabajadas: 176,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const liq = res.body.data;
    expect(liq.salarioBruto).toBe(9680000);
    expect(liq.bonoHijos).toBe(400000);
    expect(liq.porcentajeSeguridadSocial).toBe(4);
    expect(liq.valorSeguridadSocial).toBe(387200);
    expect(liq.salarioNeto).toBe(9692800);
    expect(liq.estado).toBe('CALCULADA');
    expect(liq.numeroHijos).toBe(2);
    expect(liq.cargoNombre).toBe('Administrador');
  });

  // -------------------------------------------------------------
  // PRUEBA 10: Liquidación duplicada -> Debe fallar con 409
  // -------------------------------------------------------------
  it('PRUEBA 10: Intento de liquidación duplicada para Juan Pérez 2026-09 debe fallar con 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoJuanId,
        periodo: '2026-09',
        horasTrabajadas: 176,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('El empleado ya tiene una liquidación para este periodo.');
  });

  // -------------------------------------------------------------
  // PRUEBA 11: Empleado inexistente -> Debe fallar con 404
  // -------------------------------------------------------------
  it('PRUEBA 11: Empleado inexistente (ID: 99999) debe fallar con 404 Not Found', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: 99999,
        periodo: '2026-09',
        horasTrabajadas: 160,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // -------------------------------------------------------------
  // PRUEBA 12: Empleado inactivo -> Debe impedir la liquidación (400)
  // -------------------------------------------------------------
  it('PRUEBA 12: Empleado inactivo debe impedir la liquidación con 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoInactivoId,
        periodo: '2026-09',
        horasTrabajadas: 160,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('inactivo');
  });

  // -------------------------------------------------------------
  // PRUEBA 13: Cambio posterior del empleado -> Liquidación histórica NO cambia
  // -------------------------------------------------------------
  it('PRUEBA 13: Cambio posterior del empleado NO debe alterar la liquidación histórica', async () => {
    // 1. Obtener la liquidación histórica de Juan Pérez para 2026-09
    const liqsOriginales = await request(app)
      .get(`/api/liquidaciones?empleadoId=${empleadoJuanId}&periodo=2026-09`);
    
    expect(liqsOriginales.status).toBe(200);
    const liqId = liqsOriginales.body.data[0].id;
    const valorHoraOriginal = liqsOriginales.body.data[0].valorHora;
    const bonoOriginal = liqsOriginales.body.data[0].bonoHijos;
    const netoOriginal = liqsOriginales.body.data[0].salarioNeto;

    expect(valorHoraOriginal).toBe(55000);
    expect(bonoOriginal).toBe(400000);
    expect(netoOriginal).toBe(9692800);

    // 2. Modificar el empleado: cambiar valorHora a 60000 y numeroHijos a 3
    await prisma.empleado.update({
      where: { id: empleadoJuanId },
      data: {
        valorHora: 60000,
        numeroHijos: 3,
      },
    });

    // 3. Consultar la liquidación histórica guardada previamente
    const resDetalle = await request(app).get(`/api/liquidaciones/${liqId}`);
    expect(resDetalle.status).toBe(200);
    expect(resDetalle.body.data.valorHora).toBe(55000); // Conserva $55.000
    expect(resDetalle.body.data.numeroHijos).toBe(2);   // Conserva 2 hijos
    expect(resDetalle.body.data.bonoHijos).toBe(400000); // Conserva $400.000
    expect(resDetalle.body.data.salarioNeto).toBe(9692800); // Conserva el neto original

    // 4. Restaurar valores del empleado
    await prisma.empleado.update({
      where: { id: empleadoJuanId },
      data: {
        valorHora: 55000,
        numeroHijos: 2,
      },
    });
  });

  // -------------------------------------------------------------
  // PRUEBA 14: Cambiar porcentaje de seguridad social
  // -------------------------------------------------------------
  it('PRUEBA 14: Cambiar porcentaje a 5% aplica a nuevas liquidaciones y preserva las anteriores', async () => {
    // Liquidación previa de Juan (2026-09) tiene porcentaje = 4 y seguridad = 387.200
    const resJuan = await request(app)
      .get(`/api/liquidaciones?empleadoId=${empleadoJuanId}&periodo=2026-09`);
    const liqSept = resJuan.body.data[0];
    expect(liqSept.porcentajeSeguridadSocial).toBe(4);
    expect(liqSept.valorSeguridadSocial).toBe(387200);

    // Cambiar configuración de seguridad social al 5%
    const resConfig = await request(app)
      .put('/api/configuracion/seguridad-social')
      .send({ porcentaje: 5 });
    
    expect(resConfig.status).toBe(200);
    expect(resConfig.body.data.porcentajeSeguridadSocial).toBe(5);

    // Liquidar un nuevo periodo (2026-10) para Juan Pérez con 160 horas
    // Salario Bruto: 160 * 55.000 = 8.800.000
    // Bono: 2 hijos = 400.000
    // Seguridad Social: 8.800.000 * 5% = 440.000
    // Salario Neto: 8.800.000 + 400.000 - 440.000 = 8.760.000
    const resNueva = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoJuanId,
        periodo: '2026-10',
        horasTrabajadas: 160,
      });

    expect(resNueva.status).toBe(201);
    expect(resNueva.body.data.salarioBruto).toBe(8800000);
    expect(resNueva.body.data.porcentajeSeguridadSocial).toBe(5);
    expect(resNueva.body.data.valorSeguridadSocial).toBe(440000);
    expect(resNueva.body.data.salarioNeto).toBe(8760000);

    // Verificar que la liquidación de septiembre sigue intacta con 4%
    const resHistorica = await request(app).get(`/api/liquidaciones/${liqSept.id}`);
    expect(resHistorica.body.data.porcentajeSeguridadSocial).toBe(4);
    expect(resHistorica.body.data.valorSeguridadSocial).toBe(387200);

    // Restaurar configuración al 4%
    await configuracionService.setPorcentajeSeguridadSocial(4);
  });

  // -------------------------------------------------------------
  // PRUEBA SEGURIDAD: Inyección de valores calculados desde el cliente
  // -------------------------------------------------------------
  it('PRUEBA SEGURIDAD: Debe ignorar salarioNeto falso enviado por el frontend', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({
        empleadoId: empleadoCarlosId,
        periodo: '2026-09',
        horasTrabajadas: 100,
        salarioNeto: 999999999, // Intento de manipulación maliciosa
        salarioBruto: 999999999,
        bonoHijos: 999999999,
      });

    expect(res.status).toBe(201);
    // Carlos: Operario, $28.000, 0 hijos, 100 horas
    // Salario Bruto: 100 * 28.000 = 2.800.000
    // Bono: 0
    // Seguridad social 4%: 112.000
    // Salario neto: 2.688.000
    expect(res.body.data.salarioNeto).toBe(2688000);
    expect(res.body.data.salarioBruto).toBe(2800000);
    expect(res.body.data.bonoHijos).toBe(0);
    expect(res.body.data.salarioNeto).not.toBe(999999999);
  });

  // -------------------------------------------------------------
  // PRUEBAS DE HORAS TRABAJADAS (CRUD y Validaciones)
  // -------------------------------------------------------------
  describe('CRUD Y VALIDACIONES DE HORAS TRABAJADAS', () => {
    let horaId: number;

    it('Debe registrar horas trabajadas exitosamente (POST /api/horas)', async () => {
      const res = await request(app)
        .post('/api/horas')
        .send({
          empleadoId: empleadoMariaId,
          periodo: '2026-10',
          horas: 168,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.horas).toBe(168);
      expect(res.body.data.periodo).toBe('2026-10');
      horaId = res.body.data.id;
    });

    it('Debe rechazar periodo con formato inválido (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/horas')
        .send({
          empleadoId: empleadoMariaId,
          periodo: 'septiembre-2026', // Formato inválido
          horas: 168,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Debe consultar horas filtradas por empleado (GET /api/horas?empleadoId=...) ', async () => {
      const res = await request(app)
        .get(`/api/horas?empleadoId=${empleadoMariaId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((h: { id: number }) => h.id === horaId)).toBe(true);
    });

    it('Debe consultar una hora específica por ID (GET /api/horas/:id)', async () => {
      const res = await request(app).get(`/api/horas/${horaId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(horaId);
      expect(res.body.data.horas).toBe(168);
    });

    it('Debe actualizar registro de horas (PUT /api/horas/:id)', async () => {
      const res = await request(app)
        .put(`/api/horas/${horaId}`)
        .send({
          horas: 170,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.horas).toBe(170);
    });

    it('Debe eliminar registro de horas (DELETE /api/horas/:id)', async () => {
      const res = await request(app).delete(`/api/horas/${horaId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app).get(`/api/horas/${horaId}`);
      expect(check.status).toBe(404);
    });
  });
});
