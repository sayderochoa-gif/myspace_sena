import { prisma } from '../config/prisma';
import { formatCargo, FormattedCargo } from '../utils/formatters';
import { NotFoundError } from '../utils/errors';

export class CargoService {
  /**
   * Obtiene la lista de todos los cargos disponibles
   */
  async getAllCargos(onlyActive: boolean = true): Promise<FormattedCargo[]> {
    const cargos = await prisma.cargo.findMany({
      where: onlyActive ? { activo: true } : undefined,
      orderBy: { id: 'asc' },
    });

    return cargos.map(formatCargo);
  }

  /**
   * Obtiene un cargo por su ID
   */
  async getCargoById(id: number): Promise<FormattedCargo> {
    const cargo = await prisma.cargo.findUnique({
      where: { id },
    });

    if (!cargo) {
      throw new NotFoundError(`El cargo con ID ${id} no existe`, 'CARGO_NOT_FOUND');
    }

    return formatCargo(cargo);
  }
}

export const cargoService = new CargoService();
