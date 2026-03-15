// ============================================================
// FILTRAR POR PERFIL DEL CONTRIBUYENTE
// ============================================================
// Responsabilidad única: dado un resultado del motor de cálculo
// y un perfil de usuario, retorna SOLO los vencimientos relevantes.
//
// Perfiles disponibles:
//   'pn'  — Persona Natural
//   'pj'  — Persona Jurídica
//   'gc'  — Grande Contribuyente
//   'if'  — Institución Financiera
//
// Impuestos disponibles (checkboxes del paso 3):
//   'renta_pn'       — Renta Personas Naturales
//   'renta_pj'       — Renta Personas Jurídicas
//   'renta_gc'       — Renta Grandes Contribuyentes
//   'sobretasa'      — Sobretasa Inst. Financieras
//   'iva_bimestral'  — IVA Bimestral
//   'iva_cuatrimestral' — IVA Cuatrimestral
//   'retencion'      — Retención en la Fuente
//   'simple'         — SIMPLE (anual + anticipos)
//   'patrimonio'     — Impuesto al Patrimonio
//   'exogena'        — Información Exógena 2025
// ============================================================

/**
 * Retorna los impuestos sugeridos por defecto según el tipo de contribuyente.
 * El usuario puede modificar esta selección en el paso 3.
 *
 * @param {string} tipoPerfil - 'pn' | 'pj' | 'gc' | 'if'
 * @returns {string[]} - Array de ids de impuestos sugeridos
 */
export function getImpuestosSugeridos(tipoPerfil) {
  const sugeridos = {
    pn: [
      'renta_pn',
      'iva_bimestral',
      'retencion',
      'patrimonio',
      'exogena',
    ],
    pj: [
      'renta_pj',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'simple',
      'patrimonio',
      'exogena',
    ],
    gc: [
      'renta_gc',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena',
    ],
    if: [
      'renta_pj',
      'sobretasa',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena',
    ],
  };
  return sugeridos[tipoPerfil] ?? [];
}

/**
 * Descripción legible de cada tipo de perfil.
 */
export const PERFILES = [
  {
    id: 'pn',
    label: 'Persona Natural',
    descripcion: 'Declarante individual',
    icono: '👤',
  },
  {
    id: 'pj',
    label: 'Persona Jurídica',
    descripcion: 'Sociedad / empresa',
    icono: '🏢',
  },
  {
    id: 'gc',
    label: 'Grande Contribuyente',
    descripcion: 'Calificado por la DIAN',
    icono: '🏦',
  },
  {
    id: 'if',
    label: 'Inst. Financiera',
    descripcion: 'Banco / entidad financiera',
    icono: '💳',
  },
];

/**
 * Descripción legible de cada impuesto disponible.
 */
export const IMPUESTOS_DISPONIBLES = [
  { id: 'renta_pn',          label: 'Renta Personas Naturales',     tipo: 'anual' },
  { id: 'renta_pj',          label: 'Renta Personas Jurídicas',     tipo: 'anual' },
  { id: 'renta_gc',          label: 'Renta Grandes Contribuyentes', tipo: 'anual' },
  { id: 'sobretasa',         label: 'Sobretasa Inst. Financieras',  tipo: 'anual' },
  { id: 'iva_bimestral',     label: 'IVA Bimestral',                tipo: 'periodico' },
  { id: 'iva_cuatrimestral', label: 'IVA Cuatrimestral',            tipo: 'periodico' },
  { id: 'retencion',         label: 'Retención en la Fuente',       tipo: 'periodico' },
  { id: 'simple',            label: 'SIMPLE (anual + anticipos)',   tipo: 'mixto' },
  { id: 'patrimonio',        label: 'Impuesto al Patrimonio',       tipo: 'anual' },
  { id: 'exogena',           label: 'Información Exógena 2025',     tipo: 'anual' },
];

/**
 * Filtra los anuales según los impuestos seleccionados por el usuario.
 *
 * @param {object[]} anuales   - Array de items anuales del motor de cálculo
 * @param {string[]} seleccion - Array de ids de impuestos seleccionados
 * @returns {object[]}
 */
export function filtrarAnuales(anuales, seleccion) {
  // Mapa: id del motor → id del perfil
  const mapaId = {
    renta_pn:       ['renta_pn'],
    renta_pj_cuota1: ['renta_pj'],
    renta_pj_cuota2: ['renta_pj'],
    renta_gc_cuota_1: ['renta_gc'],
    renta_gc_cuota_2: ['renta_gc'],
    renta_gc_cuota_3: ['renta_gc'],
    sobretasa_cuota_1: ['sobretasa'],
    sobretasa_cuota_2: ['sobretasa'],
    simple_anual:    ['simple'],
    patrimonio_cuota1: ['patrimonio'],
    patrimonio_cuota2: ['patrimonio'],
    exogena_gc:      ['exogena'],
    exogena_pjpn:    ['exogena'],
  };

  return anuales.filter((item) => {
    const pertenece = mapaId[item.id] ?? [];
    return pertenece.some((pid) => seleccion.includes(pid));
  });
}

/**
 * Filtra los periódicos según los impuestos seleccionados por el usuario.
 *
 * @param {object[]} periodicos - Array de items periódicos del motor de cálculo
 * @param {string[]} seleccion  - Array de ids de impuestos seleccionados
 * @returns {object[]}
 */
export function filtrarPeriodicos(periodicos, seleccion) {
  const mapaImpuesto = {
    'IVA Bimestral':          'iva_bimestral',
    'IVA Cuatrimestral':      'iva_cuatrimestral',
    'Retención en la Fuente': 'retencion',
    'Anticipo SIMPLE':        'simple',
  };

  return periodicos.filter((item) => {
    const pid = mapaImpuesto[item.impuesto];
    return pid && seleccion.includes(pid);
  });
}

/**
 * Función principal: aplica todos los filtros y retorna
 * un objeto listo para renderizar.
 *
 * @param {object}   resultado  - Output de calcularVencimientos()
 * @param {string[]} seleccion  - Impuestos seleccionados por el usuario
 * @returns {object}
 */
export function filtrarPorPerfil(resultado, seleccion) {
  if (!resultado || !seleccion || seleccion.length === 0) return null;

  const anualesFiltrados    = filtrarAnuales(resultado.anuales, seleccion);
  const periodicosFiltrados = filtrarPeriodicos(resultado.periodicos, seleccion);

  // Recalcular próximo vencimiento sobre datos filtrados
  const todas = [...anualesFiltrados, ...periodicosFiltrados];
  const proximas = todas
    .filter((i) => i.dias !== null && i.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  return {
    ...resultado,
    anuales:            anualesFiltrados,
    periodicos:         periodicosFiltrados,
    proximoVencimiento: proximas[0] ?? null,
    totalVencimientos:  todas.length,
    totalUrgentes:      todas.filter((i) => i.dias !== null && i.dias >= 0 && i.dias <= 7).length,
    totalProximos:      todas.filter((i) => i.dias !== null && i.dias > 7 && i.dias <= 30).length,
  };
}
