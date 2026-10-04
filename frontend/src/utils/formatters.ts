/**
 * Formatea un valor numérico a moneda colombiana (COP)
 */
export function formatCOP(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea una fecha ISO a una cadena amigable
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formatea un periodo YYYY-MM a un texto amigable en español (ej. 2026-09 -> Septiembre 2026)
 */
export function formatPeriodo(periodo: string | undefined | null): string {
  if (!periodo || !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    return periodo || '-';
  }
  const [year, month] = periodo.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const monthName = date.toLocaleDateString('es-CO', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}
