import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

describe('PARTE 3: SOLUCIÓN INTEGRAL DE AUTOMATIZACIÓN DE NÓMINA', () => {
  let adminToken: string;
  let rrhhToken: string;
  let empleadoToken: string;
  let empleadoJuanId: number;
  let liquidacionTestId: number;
  let notificacionTestId: number;

  beforeAll(async () => {
    // Asegurar que existan los cargos y el empleado Juan Pérez
    const cargoAdmin = await prisma.cargo.findFirst({ where: { nombre: 'Administrador' } });
    let juan = await prisma.empleado.findFirst({ where: { correo: 'juan.perez@empresa.com' } });
    if (!juan && cargoAdmin) {
      juan = await prisma.empleado.create({
        data: {
          nombre: 'Juan',
          apellido: 'Pérez',
          documento: '1098765432',
          correo: 'juan.perez@empresa.com',
          cargoId: cargoAdmin.id,
          valorHora: 55000,
          numeroHijos: 2,
          activo: true,
        },
      });
    }
    empleadoJuanId = juan!.id;

    // Login con ADMIN
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'admin@financorp.com', password: 'NominaSegura2026!' });
    expect(resAdmin.status).toBe(200);
    adminToken = resAdmin.body.data.token;

    // Login con RRHH
    const resRrhh = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'rrhh@financorp.com', password: 'NominaSegura2026!' });
    expect(resRrhh.status).toBe(200);
    rrhhToken = resRrhh.body.data.token;

    // Login con EMPLEADO
    const resEmp = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'juan.perez@empresa.com', password: 'NominaSegura2026!' });
    expect(resEmp.status).toBe(200);
    empleadoToken = resEmp.body.data.token;
  });

  // =========================================================================
  // 1. AUTENTICACIÓN Y SEGURIDAD
  // =========================================================================
  describe('1. Autenticación y Seguridad', () => {
    it('Debe rechazar credenciales incorrectas con 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'admin@financorp.com', password: 'PasswordErroneo123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('Debe retornar el mismo mensaje para correo inexistente (anti-enumeración)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'noexiste@financorp.com', password: 'CualquierPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('Debe rechazar peticiones protegidas sin token cuando se exige auth (401)', async () => {
      const res = await request(app)
        .get('/api/auditoria')
        .set('x-require-auth', 'true');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Debe rechazar token malformado o adulterado (401)', async () => {
      const res = await request(app)
        .get('/api/auditoria')
        .set('Authorization', 'Bearer token_invalido_totalmente_falso')
        .set('x-require-auth', 'true');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_TOKEN');
    });

    it('Debe obtener perfil del usuario autenticado (GET /api/auth/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.correo).toBe('admin@financorp.com');
      expect(res.body.data.rol).toBe('ADMIN');
    });
  });

  // =========================================================================
  // 2. CONTROL DE ACCESO BASADO EN ROLES (RBAC)
  // =========================================================================
  describe('2. Control de Acceso Basado en Roles (RBAC)', () => {
    it('RRHH NO debe tener permiso para acceder al módulo de Auditoría (403)', async () => {
      const res = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${rrhhToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('EMPLEADO NO debe tener permiso para listar todos los empleados (403)', async () => {
      const res = await request(app)
        .get('/api/empleados')
        .set('Authorization', `Bearer ${empleadoToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('EMPLEADO NO debe tener permiso para registrar horas (403)', async () => {
      const res = await request(app)
        .post('/api/horas')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({
          empleadoId: empleadoJuanId,
          periodo: '2026-11',
          horas: 160,
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('EMPLEADO NO debe tener permiso para cambiar configuración de seguridad social (403)', async () => {
      const res = await request(app)
        .put('/api/configuracion/seguridad-social')
        .set('Authorization', `Bearer ${empleadoToken}`)
        .send({ porcentajeSeguridadSocial: 5 });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 3. MOTOR DE LIQUIDACIÓN, PDF Y DESPACHO DE CORREO AUTOMÁTICO
  // =========================================================================
  describe('3. Liquidación Integral: PDF y Correo', () => {
    it('ADMIN debe liquidar nómina y generar automáticamente comprobante y PDF', async () => {
      // Limpiar liquidación previa para este periodo si existiera
      await prisma.liquidacion.deleteMany({
        where: {
          empleadoId: empleadoJuanId,
          periodo: '2026-10',
        },
      });

      const res = await request(app)
        .post('/api/liquidaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          empleadoId: empleadoJuanId,
          periodo: '2026-10',
          horasTrabajadas: 168,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const liq = res.body.data;
      liquidacionTestId = liq.id;

      // Validar comprobante
      expect(liq.numeroComprobante).toBe(`NOM-2026-10-${String(liq.id).padStart(6, '0')}`);
      expect(liq.pdfPath).toBeDefined();

      // Verificar que el PDF físico fue generado en disco
      expect(fs.existsSync(liq.pdfPath)).toBe(true);
      const stats = fs.statSync(liq.pdfPath);
      expect(stats.size).toBeGreaterThan(1000); // PDF con contenido real

      // Validar que se creó notificación
      expect(liq.notificaciones).toBeDefined();
      expect(liq.notificaciones.length).toBeGreaterThan(0);
      notificacionTestId = liq.notificaciones[0].id;
    });

    it('Debe permitir descargar el archivo PDF del comprobante (GET /api/liquidaciones/:id/pdf)', async () => {
      const res = await request(app)
        .get(`/api/liquidaciones/${liquidacionTestId}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
    });

    it('EMPLEADO debe poder descargar su propio volante en PDF', async () => {
      const res = await request(app)
        .get(`/api/liquidaciones/${liquidacionTestId}/pdf`)
        .set('Authorization', `Bearer ${empleadoToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('Debe permitir reintentar envío de correo (POST /api/notificaciones/:id/reintentar)', async () => {
      const res = await request(app)
        .post(`/api/notificaciones/${notificacionTestId}/reintentar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notificacionId).toBe(notificacionTestId);
    });
  });

  // =========================================================================
  // 4. PORTAL DEL EMPLEADO (PRIVACIDAD ESTRICTA)
  // =========================================================================
  describe('4. Portal del Empleado y Privacidad', () => {
    it('EMPLEADO puede consultar su perfil personal (GET /api/empleado/perfil)', async () => {
      const res = await request(app)
        .get('/api/empleado/perfil')
        .set('Authorization', `Bearer ${empleadoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(empleadoJuanId);
      expect(res.body.data.nombre).toBe('Juan');
      expect(res.body.data.correo).toBe('juan.perez@empresa.com');
    });

    it('EMPLEADO solo recibe sus propias liquidaciones (GET /api/empleado/liquidaciones)', async () => {
      const res = await request(app)
        .get('/api/empleado/liquidaciones')
        .set('Authorization', `Bearer ${empleadoToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((l: any) => {
        expect(l.empleadoId).toBe(empleadoJuanId);
      });
    });

    it('EMPLEADO no puede ver detalle ni descargar liquidación que no le pertenezca', async () => {
      // Crear temporalmente otra liquidación para otro empleado si existe
      const otroEmpleado = await prisma.empleado.findFirst({
        where: { id: { not: empleadoJuanId } },
      });

      if (otroEmpleado) {
        // Buscar o crear liquidación para el otro empleado
        let liqOtra = await prisma.liquidacion.findFirst({
          where: { empleadoId: otroEmpleado.id },
        });

        if (!liqOtra) {
          liqOtra = await prisma.liquidacion.create({
            data: {
              empleadoId: otroEmpleado.id,
              periodo: '2026-10',
              horasTrabajadas: 160,
              valorHora: 50000,
              salarioBruto: 8000000,
              bonoHijos: 0,
              porcentajeSeguridadSocial: 4,
              valorSeguridadSocial: 320000,
              salarioNeto: 7680000,
              cargoNombre: 'Otro Cargo',
            },
          });
        }

        const resGet = await request(app)
          .get(`/api/liquidaciones/${liqOtra.id}`)
          .set('Authorization', `Bearer ${empleadoToken}`);
        expect(resGet.status).toBe(403);

        const resPdf = await request(app)
          .get(`/api/liquidaciones/${liqOtra.id}/pdf`)
          .set('Authorization', `Bearer ${empleadoToken}`);
        expect(resPdf.status).toBe(403);
      }
    });
  });

  // =========================================================================
  // 5. DASHBOARD CON MÉTRICAS REALES DE BASE DE DATOS
  // =========================================================================
  describe('5. Dashboard de Nómina', () => {
    it('Debe consultar resumen del dashboard con datos agregados reales (GET /api/dashboard/resumen)', async () => {
      const res = await request(app)
        .get('/api/dashboard/resumen')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Métricas presentes
      expect(typeof data.empleados.total).toBe('number');
      expect(typeof data.empleados.activos).toBe('number');
      expect(typeof data.liquidaciones.totalPeriodo).toBe('number');
      expect(typeof data.liquidaciones.totalBruto).toBe('number');
      expect(typeof data.liquidaciones.totalBonos).toBe('number');
      expect(typeof data.liquidaciones.totalSeguridadSocial).toBe('number');
      expect(typeof data.liquidaciones.totalNeto).toBe('number');
      expect(data.notificaciones).toBeDefined();
      expect(typeof data.notificaciones.enviados).toBe('number');
      expect(typeof data.notificaciones.pendientes).toBe('number');
      expect(typeof data.notificaciones.errores).toBe('number');

      // Validar consistencia matemática de los totales acumulados
      expect(data.liquidaciones.totalNeto).toBe(
        data.liquidaciones.totalBruto + data.liquidaciones.totalBonos - data.liquidaciones.totalSeguridadSocial
      );
    });

  });

  // =========================================================================
  // 6. ANULACIÓN AUDITADA DE LIQUIDACIÓN
  // =========================================================================
  describe('6. Anulación de Liquidaciones', () => {
    it('Debe anular liquidación registrando motivo y fecha (POST /api/liquidaciones/:id/anular)', async () => {
      const res = await request(app)
        .post(`/api/liquidaciones/${liquidacionTestId}/anular`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo: 'Ajuste de horas por incapacidad médica' });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('ANULADA');
      expect(res.body.data.motivoAnulacion).toBe('Ajuste de horas por incapacidad médica');
      expect(res.body.data.fechaAnulacion).toBeDefined();
    });

    it('No debe permitir anular nuevamente una liquidación ya anulada (400)', async () => {
      const res = await request(app)
        .post(`/api/liquidaciones/${liquidacionTestId}/anular`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivo: 'Segundo intento' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ALREADY_ANULADA');
    });
  });

  // =========================================================================
  // 7. TRAZABILIDAD Y AUDITORÍA INMUTABLE
  // =========================================================================
  describe('7. Pista de Auditoría', () => {
    it('ADMIN debe poder consultar el registro de auditoría (GET /api/auditoria)', async () => {
      const res = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verificar que los eventos recientes (LOGIN, CREAR_LIQUIDACION, ANULAR_LIQUIDACION) están presentes
      const acciones = res.body.data.map((a: any) => a.accion);
      expect(acciones).toContain('LOGIN');
      expect(acciones).toContain('CREAR_LIQUIDACION');
      expect(acciones).toContain('ANULAR_LIQUIDACION');
    });
  });

  // =========================================================================
  // 8. CONFIGURACIÓN INSTITUCIONAL DE LA EMPRESA
  // =========================================================================
  describe('8. Configuración Institucional', () => {
    it('Debe consultar información de la empresa (GET /api/configuracion/empresa)', async () => {
      const res = await request(app)
        .get('/api/configuracion/empresa')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBeDefined();
      expect(res.body.data.nit).toBeDefined();
    });

    it('ADMIN debe poder actualizar los datos de la empresa (PUT /api/configuracion/empresa)', async () => {
      const res = await request(app)
        .put('/api/configuracion/empresa')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          telefono: '+57 (1) 800-9999',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.telefono).toBe('+57 (1) 800-9999');
    });
  });
});
