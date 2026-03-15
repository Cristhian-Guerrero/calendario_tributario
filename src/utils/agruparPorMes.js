// ============================================================
// AGRUPAR VENCIMIENTOS POR MES — Vista Timeline
// ============================================================
// Responsabilidad única: toma el array combinado de anuales
// y periódicos ya filtrados, y los agrupa cronológicamente
// por mes para renderizar la vista de timeline.
// ============================================================

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Retorna la clave de mes: "2026-03" para marzo 2026.
 * @param {string} fechaISO - "2026-03-14"
 * @returns {string}
 */
function clavesMes(fechaISO) {
  return fechaISO.slice(0, 7); // "2026-03"
}

/**
 * Retorna el label legible del mes: "Marzo 2026"
 * @param {string} clave - "2026-03"
 * @returns {string}
 */
function labelMes(clave) {
  const [year, month] = clave.split('-').map(Number);
  return `${MESES_ES[month - 1]} ${year}`;
}

/**
 * Clasifica el estado de urgencia del mes completo
 * según el vencimiento más próximo dentro de él.
 *
 * @param {object[]} items
 * @returns {'vencido' | 'urgente' | 'proximo' | 'futuro'}
 */
function estadoMes(items) {
  const diasMin = Math.min(
    ...items
      .filter((i) => i.dias !== null)
      .map((i) => i.dias)
  );
  if (diasMin < 0)   return 'vencido';
  if (diasMin <= 7)  return 'urgente';
  if (diasMin <= 30) return 'proximo';
  return 'futuro';
}

/**
 * Agrupa un array de vencimientos (anuales + periódicos mezclados)
 * por mes, ordenados cronológicamente.
 *
 * @param {object[]} items - Array combinado de anuales y periódicos
 * @returns {object[]} - Array de grupos ordenados por mes
 *
 * Estructura de cada grupo:
 * {
 *   clave:    "2026-03",
 *   label:    "Marzo 2026",
 *   estado:   "urgente" | "proximo" | "futuro" | "vencido",
 *   items:    [...vencimientos ordenados por fecha],
 *   conteo:   3,
 *   urgentes: 1,
 * }
 */
export function agruparPorMes(items) {
  if (!items || items.length === 0) return [];

  const mapa = new Map();

  for (const item of items) {
    if (!item.fecha) continue;

    const clave = clavesMes(item.fecha);

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        clave,
        label:    labelMes(clave),
        estado:   'futuro',
        items:    [],
        conteo:   0,
        urgentes: 0,
      });
    }

    mapa.get(clave).items.push(item);
  }

  // Ordenar items dentro de cada mes por fecha ASC
  for (const grupo of mapa.values()) {
    grupo.items.sort((a, b) => a.fecha.localeCompare(b.fecha));
    grupo.conteo   = grupo.items.length;
    grupo.urgentes = grupo.items.filter(
      (i) => i.dias !== null && i.dias >= 0 && i.dias <= 7
    ).length;
    grupo.estado   = estadoMes(grupo.items);
  }

  // Ordenar grupos cronológicamente
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, grupo]) => grupo);
}

/**
 * Separa los grupos en pasados y futuros/actuales.
 * Útil para colapsar automáticamente los meses ya vencidos.
 *
 * @param {object[]} grupos - Output de agruparPorMes()
 * @returns {{ pasados: object[], vigentes: object[] }}
 */
export function separarPasadosVigentes(grupos) {
  const pasados  = grupos.filter((g) => g.estado === 'vencido');
  const vigentes = grupos.filter((g) => g.estado !== 'vencido');
  return { pasados, vigentes };
}

/**
 * Retorna un resumen ejecutivo del año: cuántos vencimientos
 * quedan, cuántos son urgentes, el mes más cargado, etc.
 *
 * @param {object[]} grupos - Output de agruparPorMes()
 * @returns {object}
 */
export function resumenAnual(grupos) {
  const vigentes = grupos.filter((g) => g.estado !== 'vencido');
  const totalVigentes = vigentes.reduce((acc, g) => acc + g.conteo, 0);
  const totalUrgentes = vigentes.reduce((acc, g) => acc + g.urgentes, 0);

  const mesMasCargado = vigentes.reduce(
    (max, g) => (g.conteo > (max?.conteo ?? 0) ? g : max),
    null
  );

  return {
    totalVigentes,
    totalUrgentes,
    mesesConVencimientos: vigentes.length,
    mesMasCargado: mesMasCargado?.label ?? null,
    mesMasCargadoConteo: mesMasCargado?.conteo ?? 0,
  };
}
