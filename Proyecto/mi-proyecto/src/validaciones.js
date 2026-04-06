 
 

// ============================================================
// validaciones.js
// Lógica pura extraída de SecretariaPrincipal.jsx
// Este archivo es el que vas a importar en tus pruebas
// ============================================================

export const hoy = new Date().toISOString().split('T')[0]

/**
 * Valida que el teléfono tenga exactamente 10 dígitos numéricos.
 */
export const validarTelefono = (tel) =>
  String(tel || '').replace(/\D/g, '').length === 10

/**
 * Valida que la fecha no sea futura respecto a hoy.
 */
export const validarFecha = (fecha) => fecha && fecha <= hoy

/**
 * Devuelve mensaje de error por campo o string vacío si es válido.
 */
export const validarCampo = (name, value) => {
  if (name === 'telefono' || name === 'contactoEmergenciaTel') {
    if (value && value.replace(/\D/g, '').length !== 10)
      return 'El teléfono debe tener exactamente 10 dígitos'
  }
  if (name === 'fechaNacimiento' && value && value > hoy)
    return 'La fecha no puede ser mayor a hoy'
  return ''
}

/**
 * Valida todos los campos requeridos antes de enviar el formulario.
 * Retorna un objeto { valido: boolean, errores: {}, mensaje: string }
 */
export const validarFormulario = (paciente, pacientesExistentes = []) => {
  const errores = {}
  let mensaje = ''

  // 1. Campos requeridos vacíos
  const camposRequeridos = ['id', 'nombre', 'fechaNacimiento', 'genero', 'tipoSangre', 'telefono']
  if (camposRequeridos.some(c => !paciente[c]?.trim())) {
    return { valido: false, errores, mensaje: 'Ingrese los datos requeridos en cada campo' }
  }

  // 2. Cédula solo números
  if (!/^\d+$/.test(paciente.id)) {
    return { valido: false, errores, mensaje: 'No se puede agregar' }
  }

  // 3. Formato de teléfono
  if (!validarTelefono(paciente.telefono)) {
    errores.telefono = 'El teléfono debe tener exactamente 10 dígitos'
  }

  // 4. Fecha de nacimiento
  if (!validarFecha(paciente.fechaNacimiento)) {
    errores.fechaNacimiento = 'La fecha no puede ser mayor a hoy'
  }

  // 5. Teléfono de emergencia (opcional pero si viene, debe ser válido)
  if (paciente.contactoEmergenciaTel && !validarTelefono(paciente.contactoEmergenciaTel)) {
    errores.contactoEmergenciaTel = 'El teléfono debe tener exactamente 10 dígitos'
  }

  if (Object.values(errores).some(e => e)) {
    return { valido: false, errores, mensaje: 'Por favor ingrese correctamente los datos' }
  }

  // 6. ID duplicado
  if (pacientesExistentes.find(p => p.id === paciente.id.trim())) {
    return { valido: false, errores, mensaje: 'Datos ya existentes en la base de datos' }
  }

  return { valido: true, errores: {}, mensaje: '' }
}

/**
 * Calcula la edad a partir de la fecha de nacimiento.
 */
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '-'
  const hoyD = new Date(), nac = new Date(fechaNacimiento)
  let edad = hoyD.getFullYear() - nac.getFullYear()
  const m = hoyD.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoyD.getDate() < nac.getDate())) edad--
  return `${edad} años`
}

/**
 * Formatea el género para mostrarlo en texto.
 */
export const formatGenero = (g) =>
  g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g === 'O' ? 'Otro' : '-'

/**
 * Detecta si hubo cambios reales entre el objeto original y el editado.
 */
export const huboCambios = (original, editado) =>
  Object.keys(editado).some(
    key => String(editado[key] || '') !== String(original[key] || '')
  )

  