// validaciones4.js — Validaciones módulo Urgencias (emer.jsx)

export const soloLetras = (valor) =>
  /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(String(valor || '').trim())

export const soloNumeros10 = (valor) =>
  /^\d{10}$/.test(String(valor || '').trim())

export const emailValido = (valor) => {
  const v = String(valor || '').trim()
  if (!v) return true // opcional
  return /^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v)
}

export const fechaNacimientoValida = (valor) => {
  if (!valor) return false
  const [anio, mes, dia] = valor.split('-')
  const nac = new Date(anio, mes - 1, dia)
  const manana = new Date()
  manana.setHours(0, 0, 0, 0)
  manana.setDate(manana.getDate() + 1)
  return nac < manana
}

/**
 * Valida el formulario PNI completo.
 * Retorna un objeto { campo: 'mensaje de error' }
 * Si está vacío, el formulario es válido.
 */
export const validarFormPNI = (form) => {
  const e = {}

  // Nombre
  if (!String(form.nombre || '').trim())
    e.nombre = 'El nombre es obligatorio'
  else if (!soloLetras(form.nombre))
    e.nombre = 'Solo se permiten letras'

  // Teléfono
  if (!String(form.telefono || '').trim())
    e.telefono = 'El teléfono es obligatorio'
  else if (!soloNumeros10(form.telefono))
    e.telefono = 'El teléfono debe tener exactamente 10 dígitos'

  // Fecha de nacimiento
  if (!form.fechaNacimiento)
    e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
  else if (!fechaNacimientoValida(form.fechaNacimiento))
    e.fechaNacimiento = 'La fecha de nacimiento no puede ser futura'

  // Género
  if (!form.genero)
    e.genero = 'Seleccione un género'

  // Tipo de sangre
  if (!form.tipoSangre)
    e.tipoSangre = 'Seleccione el tipo de sangre'

  // Email (opcional pero si hay, debe ser válido)
  if (form.email && !emailValido(form.email))
    e.email = 'El email no es válido'

  // Dirección
  if (!String(form.direccion || '').trim())
    e.direccion = 'La dirección es obligatoria'

  // Ciudad
  if (!String(form.ciudad || '').trim())
    e.ciudad = 'La ciudad es obligatoria'
  else if (!soloLetras(form.ciudad))
    e.ciudad = 'La ciudad solo debe contener letras'

  // Contacto emergencia — opcionales pero si vienen, teléfono debe ser válido
  if (form.emergenciaTel && !soloNumeros10(form.emergenciaTel))
    e.emergenciaTel = 'El teléfono de emergencia debe tener exactamente 10 dígitos'

  if (form.emergenciaNombre && !soloLetras(form.emergenciaNombre))
    e.emergenciaNombre = 'El nombre de contacto solo debe contener letras'

  return e
}