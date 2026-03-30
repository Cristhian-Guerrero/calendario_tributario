// ============================================================
// MOTOR DE CÁLCULO DE VENCIMIENTOS TRIBUTARIOS - COLOMBIA 2026
// ============================================================
// Campo 'tipo' en cada item:
//   'pago'              → Solo pago de cuota
//   'declaracion'       → Solo presentación
//   'pago_declaracion'  → Pago + presentación
//   'reporte'           → Reporte de información
// ============================================================

import rentaPN         from '../data/impuestos/renta_personas_naturales.json';
import rentaPJ         from '../data/impuestos/renta_personas_juridicas.json';
import rentaGC         from '../data/impuestos/renta_grandes_contribuyentes.json';
import sobretasa       from '../data/impuestos/sobretasa_inst_financieras.json';
import ivaAnual        from '../data/impuestos/iva_anual.json';
import ivaBimestral    from '../data/impuestos/iva_bimestral.json';
import ivaCuatrimestral from '../data/impuestos/iva_cuatrimestral.json';
import retencion       from '../data/impuestos/retencion_fuente_mensual.json';
import simple          from '../data/impuestos/simple_anual_anticipos.json';
import patrimonio      from '../data/impuestos/impuesto_patrimonio.json';
import exogena         from '../data/impuestos/informacion_exogena_2025.json';

// ── Utilidades NIT ───────────────────────────────────────────
export function getUltimoDigito(nit) {
  return String(nit).trim().replace(/\D/g, '').slice(-1);
}

export function getDosUltimosDigitos(nit) {
  return String(nit).trim().replace(/\D/g, '').slice(-2).padStart(2, '0');
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return 'Pendiente';
  const [year, month, day] = fechaISO.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function diasParaVencer(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaISO.split('-').map(Number);
  return Math.ceil((new Date(year, month - 1, day) - hoy) / 86400000);
}

// ── Motor principal ──────────────────────────────────────────
export function calcularVencimientos(nit) {
  const nitLimpio = String(nit).trim().replace(/\D/g, '');
  if (!nitLimpio || nitLimpio.length < 1) return null;

  const d1 = getUltimoDigito(nitLimpio);
  const d2 = getDosUltimosDigitos(nitLimpio);
  const anuales    = [];
  const periodicos = [];

  const anual = (id, impuesto, detalle, fecha, tipo) =>
    anuales.push({ id, impuesto, detalle, fecha, tipo,
      fmt: formatearFecha(fecha), dias: diasParaVencer(fecha) });

  const periodico = (id, impuesto, periodo, mesVencimiento, fecha, tipo) =>
    periodicos.push({ id, impuesto, periodo, mesVencimiento, fecha, tipo,
      fmt: formatearFecha(fecha), dias: diasParaVencer(fecha) });

  // ── ANUALES ─────────────────────────────────────────────────

  // IVA Anual (2 dígitos agrupados) — febrero 2026
  anual('iva_anual', 'IVA Anual',
    'Declaración anual',
    getIvaAnualFecha(d2), 'pago_declaracion');

  // Renta PN (2 dígitos)
  anual('renta_pn', 'Renta Personas Naturales', 'Fecha límite',
    rentaPN.fechas[d2], 'pago_declaracion');

  // Renta PJ (1 dígito, 2 cuotas)
  anual('renta_pj_cuota1', 'Renta Personas Jurídicas', '1ª cuota y presentación (mayo)',
    rentaPJ.cuotas.cuota_1.fechas[d1], 'pago_declaracion');
  anual('renta_pj_cuota2', 'Renta Personas Jurídicas', '2ª cuota (julio)',
    rentaPJ.cuotas.cuota_2.fechas[d1], 'pago');

  // Renta GC (1 dígito, 3 cuotas)
  const tiposGC = ['pago', 'pago_declaracion', 'pago'];
  ['cuota_1', 'cuota_2', 'cuota_3'].forEach((cuota, i) => {
    anual(`renta_gc_${cuota}`, 'Renta Grandes Contribuyentes',
      rentaGC.cuotas[cuota].descripcion,
      rentaGC.cuotas[cuota].fechas[d1], tiposGC[i]);
  });

  // Sobretasa IF (1 dígito, 2 cuotas)
  anual('sobretasa_cuota_1', 'Sobretasa Inst. Financieras',
    sobretasa.cuotas.cuota_1.descripcion,
    sobretasa.cuotas.cuota_1.fechas[d1], 'pago_declaracion');
  anual('sobretasa_cuota_2', 'Sobretasa Inst. Financieras',
    sobretasa.cuotas.cuota_2.descripcion,
    sobretasa.cuotas.cuota_2.fechas[d1], 'pago');

  // SIMPLE Anual (2 dígitos agrupados)
  anual('simple_anual', 'SIMPLE - Declaración Anual', 'Fecha límite',
    getSimpleAnualFecha(d2), 'pago_declaracion');

  // Patrimonio (1 dígito, 2 cuotas)
  anual('patrimonio_cuota1', 'Impuesto al Patrimonio',
    patrimonio.cuotas.cuota_1.descripcion,
    patrimonio.cuotas.cuota_1.fechas[d1], 'pago_declaracion');
  anual('patrimonio_cuota2', 'Impuesto al Patrimonio',
    patrimonio.cuotas.cuota_2.descripcion,
    patrimonio.cuotas.cuota_2.fecha_unica, 'pago');

  // Exógena (reporte)
  anual('exogena_gc', 'Información Exógena 2025', 'Grandes Contribuyentes',
    exogena.grandes_contribuyentes.fechas[d1], 'reporte');
  anual('exogena_pjpn', 'Información Exógena 2025', 'Personas Jurídicas y Naturales',
    getExogenaRangoFecha(d2), 'reporte');

  // ── PERIÓDICOS ───────────────────────────────────────────────

  ivaBimestral.periodos.forEach(p => {
    periodico(`iva_bimestral_${p.periodo.replace(/\s/g,'_')}`,
      'IVA Bimestral', p.periodo, p.mes_vencimiento,
      p.fechas[d1], 'pago_declaracion');
  });

  ivaCuatrimestral.periodos.forEach(p => {
    periodico(`iva_cuatrimestral_${p.periodo.replace(/\s/g,'_')}`,
      'IVA Cuatrimestral', p.periodo, p.mes_vencimiento,
      p.fechas[d1], 'pago_declaracion');
  });

  retencion.meses.forEach(m => {
    periodico(`retencion_${m.mes_retencion}`,
      'Retención en la Fuente', m.mes_retencion, m.mes_vencimiento,
      m.fechas[d1], 'pago_declaracion');
  });

  simple.anticipos.periodos.forEach(p => {
    periodico(`simple_anticipo_${p.periodo.replace(/\s/g,'_')}`,
      'Anticipo SIMPLE', p.periodo, p.mes_vencimiento,
      p.fechas[d1], 'pago');
  });

  // ── Próximo vencimiento ──────────────────────────────────────
  const todas   = [...anuales, ...periodicos];
  const proximas = todas
    .filter(i => i.fecha && i.dias !== null && i.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  return {
    nit: nitLimpio, ultimoDigito: d1, dosUltimosDigitos: d2,
    anuales, periodicos,
    proximoVencimiento: proximas[0] ?? null,
  };
}

// ── Helpers internos ─────────────────────────────────────────

// IVA Anual — misma lógica de agrupación que SIMPLE
function getIvaAnualFecha(d2) {
  const n = parseInt(d2, 10);
  const f = ivaAnual.fechas;
  if (n <= 2) return f['1-2'];
  if (n <= 4) return f['3-4'];
  if (n <= 6) return f['5-6'];
  if (n <= 8) return f['7-8'];
  return f['9-0'];
}

function getSimpleAnualFecha(d2) {
  const n = parseInt(d2, 10);
  const f = simple.simple_anual.fechas;
  if (n <= 2) return f['1-2'];
  if (n <= 4) return f['3-4'];
  if (n <= 6) return f['5-6'];
  if (n <= 8) return f['7-8'];
  return f['9-0'];
}

function getExogenaRangoFecha(d2) {
  const n = d2 === '00' ? 100 : parseInt(d2, 10);
  for (const r of exogena.personas_juridicas_naturales.rangos) {
    const desde = parseInt(r.desde, 10);
    const hasta = r.hasta === '00' ? 100 : parseInt(r.hasta, 10);
    if (n >= desde && n <= hasta) return r.fecha;
  }
  return null;
}
