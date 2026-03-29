// ============================================================
// FILTRAR POR PERFIL DEL CONTRIBUYENTE
// ============================================================
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
//   'exogena_gc'     — Exógena 2025 Grandes Contribuyentes  ← SEPARADO
//   'exogena_pjpn'   — Exógena 2025 PJ y Personas Naturales ← SEPARADO
// ============================================================

/**
 * Retorna los impuestos sugeridos por defecto según el tipo de contribuyente.
 * Cada perfil sugiere SOLO la Exógena que le corresponde.
 */
export function getImpuestosSugeridos(tipoPerfil) {
  const sugeridos = {
    pn: [
      'renta_pn',
      'iva_bimestral',
      'retencion',
      'patrimonio',
      'exogena_pjpn',      // PN → solo Exógena PJ/PN
    ],
    pj: [
      'renta_pj',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'simple',
      'patrimonio',
      'exogena_pjpn',      // PJ → solo Exógena PJ/PN
    ],
    gc: [
      'renta_gc',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena_gc',        // GC → solo Exógena Grandes Contribuyentes
    ],
    if: [
      'renta_pj',
      'sobretasa',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena_gc',        // IF → calificados como GC generalmente
    ],
  };
  return sugeridos[tipoPerfil] ?? [];
}

/**
 * Descripción legible de cada tipo de perfil.
 */
export const PERFILES = [
  { id: 'pn', label: 'Persona Natural',      descripcion: 'Declarante individual',    icono: '👤' },
  { id: 'pj', label: 'Persona Jurídica',      descripcion: 'Sociedad / empresa',       icono: '🏢' },
  { id: 'gc', label: 'Grande Contribuyente',  descripcion: 'Calificado por la DIAN',   icono: '🏦' },
  { id: 'if', label: 'Inst. Financiera',      descripcion: 'Banco / entidad financiera', icono: '💳' },
];

/**
 * Impuestos disponibles como chips en el paso 3.
 * Exógena aparece como DOS opciones separadas y claras.
 */
export const IMPUESTOS_DISPONIBLES = [
  { id: 'renta_pn',          label: 'Renta Personas Naturales',          tipo: 'anual'     },
  { id: 'renta_pj',          label: 'Renta Personas Jurídicas',          tipo: 'anual'     },
  { id: 'renta_gc',          label: 'Renta Grandes Contribuyentes',      tipo: 'anual'     },
  { id: 'sobretasa',         label: 'Sobretasa Inst. Financieras',       tipo: 'anual'     },
  { id: 'iva_bimestral',     label: 'IVA Bimestral',                     tipo: 'periodico' },
  { id: 'iva_cuatrimestral', label: 'IVA Cuatrimestral',                 tipo: 'periodico' },
  { id: 'retencion',         label: 'Retención en la Fuente',            tipo: 'periodico' },
  { id: 'simple',            label: 'SIMPLE (anual + anticipos)',        tipo: 'mixto'     },
  { id: 'patrimonio',        label: 'Impuesto al Patrimonio',            tipo: 'anual'     },
  { id: 'exogena_gc',        label: 'Exógena 2025 — Grandes Contrib.',   tipo: 'anual'     },
  { id: 'exogena_pjpn',      label: 'Exógena 2025 — PJ y Pers. Nat.',   tipo: 'anual'     },
];

/**
 * Filtra los anuales según los impuestos seleccionados.
 * Ahora exogena_gc y exogena_pjpn son IDs independientes.
 */
export function filtrarAnuales(anuales, seleccion) {
  const mapaId = {
    renta_pn:          ['renta_pn'],
    renta_pj_cuota1:   ['renta_pj'],
    renta_pj_cuota2:   ['renta_pj'],
    renta_gc_cuota_1:  ['renta_gc'],
    renta_gc_cuota_2:  ['renta_gc'],
    renta_gc_cuota_3:  ['renta_gc'],
    sobretasa_cuota_1: ['sobretasa'],
    sobretasa_cuota_2: ['sobretasa'],
    simple_anual:      ['simple'],
    patrimonio_cuota1: ['patrimonio'],
    patrimonio_cuota2: ['patrimonio'],
    exogena_gc:        ['exogena_gc'],    // ← ID propio, no comparte con pjpn
    exogena_pjpn:      ['exogena_pjpn'], // ← ID propio, no comparte con gc
  };

  return anuales.filter((item) => {
    const pertenece = mapaId[item.id] ?? [];
    return pertenece.some((pid) => seleccion.includes(pid));
  });
}

/**
 * Filtra los periódicos según los impuestos seleccionados.
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
 * Función principal: aplica todos los filtros.
 */
export function filtrarPorPerfil(resultado, seleccion) {
  if (!resultado || !seleccion || seleccion.length === 0) return null;

  const anualesFiltrados    = filtrarAnuales(resultado.anuales, seleccion);
  const periodicosFiltrados = filtrarPeriodicos(resultado.periodicos, seleccion);

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
