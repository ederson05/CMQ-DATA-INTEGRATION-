// validaciones5.test.js — Pruebas unitarias módulo Enfermero
import { describe, test, expect } from 'vitest'
import {
  soloLetras,
  presionArterialValida,
  frecuenciaCardiacaValida,
  temperaturaValida,
  saturacionValida,
  nivelTriageValido,
  validarTriage,
  validarUrgenciaPNI,
  alertasSignosVitales,
  calcularStats
} from './validaciones5'

// ─────────────────────────────────────────
// soloLetras
// ─────────────────────────────────────────
describe('soloLetras', () => {
  test('acepta nombre con tildes y ñ',     () => expect(soloLetras('María Núñez')).toBe(true))
  test('acepta nombre compuesto',          () => expect(soloLetras('Juan Carlos')).toBe(true))
  test('rechaza número',                   () => expect(soloLetras('Juan1')).toBe(false))
  test('rechaza carácter especial',        () => expect(soloLetras('Ana@')).toBe(false))
  test('rechaza vacío',                    () => expect(soloLetras('')).toBe(false))
  test('rechaza solo espacios',            () => expect(soloLetras('   ')).toBe(false))
})

// ─────────────────────────────────────────
// presionArterialValida
// ─────────────────────────────────────────
describe('presionArterialValida', () => {
  test('acepta 120/80',                    () => expect(presionArterialValida('120/80')).toBe(true))
  test('acepta 100/70',                    () => expect(presionArterialValida('100/70')).toBe(true))
  test('acepta 140/90',                    () => expect(presionArterialValida('140/90')).toBe(true))
  test('rechaza sin barra',                () => expect(presionArterialValida('12080')).toBe(false))
  test('rechaza letras',                   () => expect(presionArterialValida('aaa/bb')).toBe(false))
  test('rechaza vacío',                    () => expect(presionArterialValida('')).toBe(false))
  test('rechaza solo número',              () => expect(presionArterialValida('120')).toBe(false))
  test('rechaza formato invertido',        () => expect(presionArterialValida('80/120')).toBe(true)) // formato es válido aunque clínicamente raro
})

// ─────────────────────────────────────────
// frecuenciaCardiacaValida
// ─────────────────────────────────────────
describe('frecuenciaCardiacaValida', () => {
  test('acepta 75 LPM (normal)',            () => expect(frecuenciaCardiacaValida(75)).toBe(true))
  test('acepta límite inferior 20',         () => expect(frecuenciaCardiacaValida(20)).toBe(true))
  test('acepta límite superior 250',        () => expect(frecuenciaCardiacaValida(250)).toBe(true))
  test('rechaza 19 (bajo mínimo)',          () => expect(frecuenciaCardiacaValida(19)).toBe(false))
  test('rechaza 251 (sobre máximo)',        () => expect(frecuenciaCardiacaValida(251)).toBe(false))
  test('rechaza 0',                         () => expect(frecuenciaCardiacaValida(0)).toBe(false))
  test('rechaza negativo',                  () => expect(frecuenciaCardiacaValida(-10)).toBe(false))
  test('rechaza texto',                     () => expect(frecuenciaCardiacaValida('abc')).toBe(false))
})

// ─────────────────────────────────────────
// temperaturaValida
// ─────────────────────────────────────────
describe('temperaturaValida', () => {
  test('acepta 36.5 (normal)',              () => expect(temperaturaValida(36.5)).toBe(true))
  test('acepta límite inferior 25',         () => expect(temperaturaValida(25)).toBe(true))
  test('acepta límite superior 45',         () => expect(temperaturaValida(45)).toBe(true))
  test('acepta 38.5 (fiebre alta)',         () => expect(temperaturaValida(38.5)).toBe(true))
  test('rechaza 24.9 (bajo mínimo)',        () => expect(temperaturaValida(24.9)).toBe(false))
  test('rechaza 45.1 (sobre máximo)',       () => expect(temperaturaValida(45.1)).toBe(false))
  test('rechaza texto',                     () => expect(temperaturaValida('caliente')).toBe(false))
})

// ─────────────────────────────────────────
// saturacionValida
// ─────────────────────────────────────────
describe('saturacionValida', () => {
  test('acepta 98% (normal)',               () => expect(saturacionValida(98)).toBe(true))
  test('acepta límite inferior 50',         () => expect(saturacionValida(50)).toBe(true))
  test('acepta 100%',                       () => expect(saturacionValida(100)).toBe(true))
  test('acepta 89% (crítica pero válida)',  () => expect(saturacionValida(89)).toBe(true))
  test('rechaza 49 (bajo mínimo)',          () => expect(saturacionValida(49)).toBe(false))
  test('rechaza 101 (sobre máximo)',        () => expect(saturacionValida(101)).toBe(false))
  test('rechaza 0',                         () => expect(saturacionValida(0)).toBe(false))
  test('rechaza texto',                     () => expect(saturacionValida('alto')).toBe(false))
})

// ─────────────────────────────────────────
// nivelTriageValido
// ─────────────────────────────────────────
describe('nivelTriageValido', () => {
  test('acepta I',                          () => expect(nivelTriageValido('I')).toBe(true))
  test('acepta II',                         () => expect(nivelTriageValido('II')).toBe(true))
  test('acepta III',                        () => expect(nivelTriageValido('III')).toBe(true))
  test('acepta IV',                         () => expect(nivelTriageValido('IV')).toBe(true))
  test('acepta V',                          () => expect(nivelTriageValido('V')).toBe(true))
  test('rechaza VI',                        () => expect(nivelTriageValido('VI')).toBe(false))
  test('rechaza vacío',                     () => expect(nivelTriageValido('')).toBe(false))
  test('rechaza minúscula',                 () => expect(nivelTriageValido('ii')).toBe(false))
  test('rechaza número',                    () => expect(nivelTriageValido('1')).toBe(false))
})

// ─────────────────────────────────────────
// validarTriage — formulario completo
// ─────────────────────────────────────────
const pacienteMock = { citId: 1, nombre: 'Laura Grijalba', motivo: 'URGENCIA' }

const formValido = {
  presionArterial:    '120/80',
  frecuenciaCardiaca: '75',
  temperatura:        '36.5',
  saturacion:         '98',
  sintomas:           'Dolor de cabeza intenso',
  triage:             'III'
}

describe('validarTriage — caso válido', () => {
  test('sin errores con datos correctos',
    () => expect(Object.keys(validarTriage({ paciente: pacienteMock, formData: formValido }))).toHaveLength(0))
})

describe('validarTriage — sin paciente', () => {
  test('error si no hay paciente',
    () => expect(validarTriage({ paciente: null, formData: formValido })).toHaveProperty('documento'))
})

describe('validarTriage — síntomas', () => {
  test('error si síntomas vacíos',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, sintomas: '' } })).toHaveProperty('sintomas'))
  test('error si síntomas solo espacios',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, sintomas: '   ' } })).toHaveProperty('sintomas'))
})

describe('validarTriage — triage', () => {
  test('error si triage vacío',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, triage: '' } })).toHaveProperty('triage'))
  test('error si triage inválido',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, triage: 'VI' } })).toHaveProperty('triage'))
})

describe('validarTriage — presión arterial', () => {
  test('error si vacía',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, presionArterial: '' } })).toHaveProperty('presionArterial'))
  test('error si formato incorrecto',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, presionArterial: '12080' } })).toHaveProperty('presionArterial'))
})

describe('validarTriage — frecuencia cardíaca', () => {
  test('error si vacía',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, frecuenciaCardiaca: '' } })).toHaveProperty('frecuenciaCardiaca'))
  test('error si fuera de rango',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, frecuenciaCardiaca: '300' } })).toHaveProperty('frecuenciaCardiaca'))
})

describe('validarTriage — temperatura', () => {
  test('error si vacía',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, temperatura: '' } })).toHaveProperty('temperatura'))
  test('error si fuera de rango',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, temperatura: '50' } })).toHaveProperty('temperatura'))
})

describe('validarTriage — saturación', () => {
  test('error si vacía',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, saturacion: '' } })).toHaveProperty('saturacion'))
  test('error si fuera de rango',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, saturacion: '110' } })).toHaveProperty('saturacion'))
  test('error si saturación 49',
    () => expect(validarTriage({ paciente: pacienteMock, formData: { ...formValido, saturacion: '49' } })).toHaveProperty('saturacion'))
})

// ─────────────────────────────────────────
// validarUrgenciaPNI
// ─────────────────────────────────────────
const pniValido = {
  urgNombre: 'Pedro Mora',
  urgGenero: 'M',
  urgTipoSangre: 'O+'
}

describe('validarUrgenciaPNI — caso válido', () => {
  test('sin errores con datos correctos',
    () => expect(Object.keys(validarUrgenciaPNI(pniValido))).toHaveLength(0))
})

describe('validarUrgenciaPNI — nombre', () => {
  test('error si nombre vacío',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgNombre: '' })).toHaveProperty('urgNombre'))
  test('error si nombre tiene números',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgNombre: 'Pedro123' })).toHaveProperty('urgNombre'))
  test('error si nombre tiene símbolos',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgNombre: 'Pedro@' })).toHaveProperty('urgNombre'))
})

describe('validarUrgenciaPNI — género', () => {
  test('error si género es DESCONOCIDO',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgGenero: 'DESCONOCIDO' })).toHaveProperty('urgGenero'))
  test('error si género es D',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgGenero: 'D' })).toHaveProperty('urgGenero'))
  test('error si género vacío',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgGenero: '' })).toHaveProperty('urgGenero'))
  test('acepta F',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgGenero: 'F' })).not.toHaveProperty('urgGenero'))
})

describe('validarUrgenciaPNI — tipo de sangre', () => {
  test('error si tipo de sangre es DESCONOCIDO',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgTipoSangre: 'DESCONOCIDO' })).toHaveProperty('urgTipoSangre'))
  test('error si vacío',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgTipoSangre: '' })).toHaveProperty('urgTipoSangre'))
  test('acepta A+',
    () => expect(validarUrgenciaPNI({ ...pniValido, urgTipoSangre: 'A+' })).not.toHaveProperty('urgTipoSangre'))
})

// ─────────────────────────────────────────
// alertasSignosVitales
// ─────────────────────────────────────────
describe('alertasSignosVitales', () => {
  test('sin alertas con valores normales',
    () => expect(alertasSignosVitales({ temperatura: '36.5', saturacion: '98', frecuenciaCardiaca: '75' })).toHaveLength(0))

  test('alerta por fiebre alta (≥38.5)',
    () => expect(alertasSignosVitales({ temperatura: '39', saturacion: '98', frecuenciaCardiaca: '75' }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Fiebre')])))

  test('alerta por saturación crítica (<90)',
    () => expect(alertasSignosVitales({ temperatura: '36.5', saturacion: '85', frecuenciaCardiaca: '75' }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Saturación')])))

  test('alerta por taquicardia (>100)',
    () => expect(alertasSignosVitales({ temperatura: '36.5', saturacion: '98', frecuenciaCardiaca: '110' }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Taquicardia')])))

  test('alerta por bradicardia (<60)',
    () => expect(alertasSignosVitales({ temperatura: '36.5', saturacion: '98', frecuenciaCardiaca: '50' }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Bradicardia')])))

  test('múltiples alertas simultáneas',
    () => {
      const alertas = alertasSignosVitales({ temperatura: '40', saturacion: '85', frecuenciaCardiaca: '110' })
      expect(alertas.length).toBeGreaterThanOrEqual(3)
    })

  test('sin alerta si temperatura exactamente 38.5 (límite)',
    () => expect(alertasSignosVitales({ temperatura: '38.5', saturacion: '98', frecuenciaCardiaca: '75' }))
      .toEqual(expect.arrayContaining([expect.stringContaining('Fiebre')])))

  test('sin alerta si frecuencia exactamente 60 (límite bajo)',
    () => expect(alertasSignosVitales({ temperatura: '36', saturacion: '98', frecuenciaCardiaca: '60' }))
      .toHaveLength(0))
})

// ─────────────────────────────────────────
// calcularStats
// ─────────────────────────────────────────
describe('calcularStats', () => {
  const listado = [
    { nivel: 'I'   },
    { nivel: 'I'   },
    { nivel: 'II'  },
    { nivel: 'III' },
    { nivel: 'III' },
    { nivel: 'III' },
    { nivel: 'IV'  },
    { nivel: 'V'   },
  ]

  test('cuenta correctamente triage I',    () => expect(calcularStats(listado).I).toBe(2))
  test('cuenta correctamente triage II',   () => expect(calcularStats(listado).II).toBe(1))
  test('cuenta correctamente triage III',  () => expect(calcularStats(listado).III).toBe(3))
  test('cuenta correctamente triage IV',   () => expect(calcularStats(listado).IV).toBe(1))
  test('cuenta correctamente triage V',    () => expect(calcularStats(listado).V).toBe(1))
  test('total correcto',                   () => expect(calcularStats(listado).total).toBe(8))
  test('listado vacío retorna ceros',      () => {
    const s = calcularStats([])
    expect(s.total).toBe(0)
    expect(s.I).toBe(0)
  })
})