import { prisma } from '../config/prisma';

export interface DashboardResumen {
  empleados: {
    total: number;
    activos: number;
    inactivos: number;
  };
  periodoSeleccionado: string;
  liquidaciones: {
    totalPeriodo: number;
    calculadas: number;
    anuladas: number;
    pendientes: number;
    totalBruto: number;
    totalBonos: number;
    totalSeguridadSocial: number;
    totalNeto: number;
  };
  notificaciones: {
    total: number;
    enviados: number;
    pendientes: number;
    errores: number;
  };
  ultimasLiquidaciones: Array<{
    id: number;
    empleadoNombre: string;
    periodo: string;
    salarioNeto: number;
    estado: string;
    fecha: string;
    numeroComprobante: string;
  }>;
}

export class DashboardService {
  /**
   * Obtiene el resumen consolidado de métricas para el Dashboard
   * Calculado 100% en tiempo real desde la base de datos PostgreSQL
   */
  async obtenerResumen(periodoFiltro?: string): Promise<DashboardResumen> {
    // Si no se especifica periodo, tomamos el mes actual YYYY-MM
    let periodo = periodoFiltro;
    if (!periodo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
      const now = new Date();
      periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // 1. Estadísticas de Empleados
    const [totalEmpleados, empleadosActivos, empleadosInactivos] = await Promise.all([
      prisma.empleado.count(),
      prisma.empleado.count({ where: { activo: true } }),
      prisma.empleado.count({ where: { activo: false } }),
    ]);

    // 2. Liquidaciones del Periodo (totales y por estado)
    const [
      totalLiquidacionesPeriodo,
      liquidacionesCalculadas,
      liquidacionesAnuladas,
      liquidacionesPendientes,
    ] = await Promise.all([
      prisma.liquidacion.count({ where: { periodo } }),
      prisma.liquidacion.count({ where: { periodo, estado: 'CALCULADA' } }),
      prisma.liquidacion.count({ where: { periodo, estado: 'ANULADA' } }),
      prisma.liquidacion.count({ where: { periodo, estado: 'PENDIENTE' } }),
    ]);

    // 3. Agregados Monetarios del Periodo (solo liquidaciones CALCULADAS válidas)
    const agregados = await prisma.liquidacion.aggregate({
      where: {
        periodo,
        estado: 'CALCULADA',
      },
      _sum: {
        salarioBruto: true,
        bonoHijos: true,
        valorSeguridadSocial: true,
        salarioNeto: true,
      },
    });

    const totalBruto = agregados._sum.salarioBruto ? Number(agregados._sum.salarioBruto) : 0;
    const totalBonos = agregados._sum.bonoHijos ? Number(agregados._sum.bonoHijos) : 0;
    const totalSeguridadSocial = agregados._sum.valorSeguridadSocial
      ? Number(agregados._sum.valorSeguridadSocial)
      : 0;
    const totalNeto = agregados._sum.salarioNeto ? Number(agregados._sum.salarioNeto) : 0;

    // 4. Estadísticas de Notificaciones / Envíos de Correo
    const [totalNotificaciones, enviados, pendientes, errores] = await Promise.all([
      prisma.notificacion.count(),
      prisma.notificacion.count({ where: { estado: 'ENVIADO' } }),
      prisma.notificacion.count({ where: { estado: 'PENDIENTE' } }),
      prisma.notificacion.count({ where: { estado: 'ERROR' } }),
    ]);

    // 5. Últimas 5 liquidaciones recientes
    const recientes = await prisma.liquidacion.findMany({
      include: {
        empleado: true,
      },
      orderBy: { fechaLiquidacion: 'desc' },
      take: 5,
    });

    const ultimasLiquidaciones = recientes.map((liq) => ({
      id: liq.id,
      empleadoNombre: `${liq.empleado.nombre} ${liq.empleado.apellido}`,
      periodo: liq.periodo,
      salarioNeto: Number(liq.salarioNeto),
      estado: liq.estado,
      fecha: liq.fechaLiquidacion.toISOString(),
      numeroComprobante: liq.numeroComprobante || `NOM-${liq.periodo}-${String(liq.id).padStart(6, '0')}`,
    }));

    return {
      empleados: {
        total: totalEmpleados,
        activos: empleadosActivos,
        inactivos: empleadosInactivos,
      },
      periodoSeleccionado: periodo,
      liquidaciones: {
        totalPeriodo: totalLiquidacionesPeriodo,
        calculadas: liquidacionesCalculadas,
        anuladas: liquidacionesAnuladas,
        pendientes: liquidacionesPendientes,
        totalBruto,
        totalBonos,
        totalSeguridadSocial,
        totalNeto,
      },
      notificaciones: {
        total: totalNotificaciones,
        enviados,
        pendientes,
        errores,
      },
      ultimasLiquidaciones,
    };
  }
}

export const dashboardService = new DashboardService();
