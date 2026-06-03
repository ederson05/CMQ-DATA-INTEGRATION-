// validaciones5.js — Validaciones módulo Enfermero (enfermero_principal.jsx)

export const soloLetras = (valor) =>
  /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(String(valor || '').trim())

export const presionArterialValida = (valor) =>
  /^\d{2,3}\/\d{2,3}$/.test(String(valor || '').trim())

export const frecuenciaCardiacaValida = (valor) => {
  const v = Number(valor)
  return !isNaN(v) && v >= 20 && v <= 250
}

export const temperaturaValida = (valor) => {
  const v = Number(valor)
  return !isNaN(v) && v >= 25 && v <= 45
}

export const saturacionValida = (valor) => {
  const v = Number(valor)
  return !isNaN(v) && v >= 50 && v <= 100
}

export const nivelTriageValido = (valor) =>
  ['I', 'II', 'III', 'IV', 'V'].includes(valor)

/**
 * Valida el formulario de triage.
 * Retorna objeto { campo: 'mensaje' }. Vacío = válido.
 */
export const validarTriage = ({ paciente, formData }) => {
  const errs = {}

  if (!paciente)
    return { documento: 'Busque y seleccione un paciente primero' }

  if (!String(formData.sintomas || '').trim())
    errs.sintomas = 'Los síntomas son obligatorios'

  if (!formData.triage)
    errs.triage = 'Seleccione un nivel de triage'
  else if (!nivelTriageValido(formData.triage))
    errs.triage = 'Nivel de triage inválido'

  if (!formData.presionArterial)
    errs.presionArterial = 'La presión arterial es obligatoria'
  else if (!presionArterialValida(formData.presionArterial))
    errs.presionArterial = 'Formato inválido (Ej: 120/80)'

  if (!formData.frecuenciaCardiaca)
    errs.frecuenciaCardiaca = 'La frecuencia cardíaca es obligatoria'
  else if (!frecuenciaCardiacaValida(formData.frecuenciaCardiaca))
    errs.frecuenciaCardiaca = 'Frecuencia inválida (rango: 20 – 250 LPM)'

  if (!formData.temperatura)
    errs.temperatura = 'La temperatura es obligatoria'
  else if (!temperaturaValida(formData.temperatura))
    errs.temperatura = 'Temperatura inválida (rango: 25°C – 45°C)'

  if (!formData.saturacion)
    errs.saturacion = 'La saturación es obligatoria'
  else if (!saturacionValida(formData.saturacion))
    errs.saturacion = 'Saturación inválida (rango: 50% – 100%)'

  return errs
}

/**
 * Valida el formulario de urgencia PNI.
 * Retorna objeto { campo: 'mensaje' }. Vacío = válido.
 */
export const validarUrgenciaPNI = (formData) => {
  const errs = {}

  if (!String(formData.urgNombre || '').trim())
    errs.urgNombre = 'El nombre es obligatorio'
  else if (!soloLetras(formData.urgNombre))
    errs.urgNombre = 'Solo se permiten letras'

  if (!formData.urgGenero || ['D', 'DESCONOCIDO'].includes(formData.urgGenero))
    errs.urgGenero = 'Seleccione un género'

  if (!formData.urgTipoSangre || formData.urgTipoSangre === 'DESCONOCIDO')
    errs.urgTipoSangre = 'Seleccione el tipo de sangre'

  return errs
}

/**
 * Detecta alertas clínicas según signos vitales.
 * Retorna array de strings con las alertas.
 */
export const alertasSignosVitales = (formData) => {
  const alertas = []
  if (formData.temperatura && Number(formData.temperatura) >= 38.5)
    alertas.push('⚠️ Fiebre alta (≥38.5°C)')
  if (formData.saturacion && Number(formData.saturacion) < 90)
    alertas.push('🔴 Saturación crítica (<90%)')
  if (formData.frecuenciaCardiaca && Number(formData.frecuenciaCardiaca) > 100)
    alertas.push('⚠️ Taquicardia (>100 LPM)')
  if (formData.frecuenciaCardiaca && Number(formData.frecuenciaCardiaca) < 60)
    alertas.push('⚠️ Bradicardia (<60 LPM)')
  return alertas
}

/**
 * Calcula estadísticas de triage por nivel.
 */
export const calcularStats = (listado) => {
  const stats = { I: 0, II: 0, III: 0, IV: 0, V: 0, total: listado.length }
  listado.forEach(p => { if (stats[p.nivel] !== undefined) stats[p.nivel]++ })
  return stats
}