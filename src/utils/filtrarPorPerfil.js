// ============================================================
// FILTRAR POR PERFIL DEL CONTRIBUYENTE
// ============================================================

export function getImpuestosSugeridos(tipoPerfil) {
  const sugeridos = {
    pn: [
      'iva_anual',         // IVA Anual aplica a PN del régimen simplificado
      'renta_pn',
      'iva_bimestral',
      'retencion',
      'patrimonio',
      'exogena_pjpn',
    ],
    pj: [
      'renta_pj',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'simple',
      'patrimonio',
      'exogena_pjpn',
    ],
    gc: [
      'renta_gc',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena_gc',
    ],
    if: [
      'renta_pj',
      'sobretasa',
      'iva_bimestral',
      'iva_cuatrimestral',
      'retencion',
      'patrimonio',
      'exogena_gc',
    ],
  };
  return sugeridos[tipoPerfil] ?? [];
}

export const PERFILES = [
  { id: 'pn', label: 'Persona Natural',      descripcion: 'Declarante individual',      icono: '👤' },
  { id: 'pj', label: 'Persona Jurídica',      descripcion: 'Sociedad / empresa',         icono: '🏢' },
  { id: 'gc', label: 'Grande Contribuyente',  descripcion: 'Calificado por la DIAN',     icono: '🏦' },
  { id: 'if', label: 'Inst. Financiera',      descripcion: 'Banco / entidad financiera', icono: '💳' },
];

export const IMPUESTOS_DISPONIBLES = [
  { id: 'iva_anual',         label: 'IVA Anual',                          tipo: 'anual'     },
  { id: 'renta_pn',          label: 'Renta Personas Naturales',           tipo: 'anual'     },
  { id: 'renta_pj',          label: 'Renta Personas Jurídicas',           tipo: 'anual'     },
  { id: 'renta_gc',          label: 'Renta Grandes Contribuyentes',       tipo: 'anual'     },
  { id: 'sobretasa',         label: 'Sobretasa Inst. Financieras',        tipo: 'anual'     },
  { id: 'iva_bimestral',     label: 'IVA Bimestral',                      tipo: 'periodico' },
  { id: 'iva_cuatrimestral', label: 'IVA Cuatrimestral',                  tipo: 'periodico' },
  { id: 'retencion',         label: 'Retención en la Fuente',             tipo: 'periodico' },
  { id: 'simple',            label: 'SIMPLE (anual + anticipos)',         tipo: 'mixto'     },
  { id: 'patrimonio',        label: 'Impuesto al Patrimonio',             tipo: 'anual'     },
  { id: 'exogena_gc',        label: 'Exógena 2025 — Grandes Contrib.',    tipo: 'anual'     },
  { id: 'exogena_pjpn',      label: 'Exógena 2025 — PJ y Pers. Nat.',    tipo: 'anual'     },
];

export function filtrarAnuales(anuales, seleccion) {
  const mapaId = {
    iva_anual:         ['iva_anual'],
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
    exogena_gc:        ['exogena_gc'],
    exogena_pjpn:      ['exogena_pjpn'],
  };

  return anuales.filter((item) => {
    const pertenece = mapaId[item.id] ?? [];
    return pertenece.some((pid) => seleccion.includes(pid));
  });
}

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
