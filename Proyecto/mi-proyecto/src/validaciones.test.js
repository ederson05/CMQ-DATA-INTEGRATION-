// ============================================================
// validaciones.test.js
// Pruebas unitarias — SecretariaPrincipal (Hospital CMQ)
// Ejecutar con: npm test
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  validarTelefono,
  validarFecha,
  validarCampo,
  validarFormulario,
  calcularEdad,
  formatGenero,
  huboCambios,
  hoy
} from './validaciones.js'

// ══════════════════════════════════════════════════
// 1. validarTelefono
// ══════════════════════════════════════════════════
describe('validarTelefono', () => {
  it('✅ acepta teléfono de exactamente 10 dígitos', () => {
    expect(validarTelefono('3214556879')).toBe(true)
  })

  it('✅ acepta teléfono con formato (321) 455-6879', () => {
    // Los caracteres no numéricos se eliminan, quedan 10 dígitos
    expect(validarTelefono('(321) 455-6879')).toBe(true)
  })

  it('❌ rechaza teléfono con menos de 10 dígitos', () => {
    expect(validarTelefono('321455')).toBe(false)
  })

  it('❌ rechaza teléfono con más de 10 dígitos', () => {
    expect(validarTelefono('32145568791234')).toBe(false)
  })

  it('❌ rechaza teléfono vacío', () => {
    expect(validarTelefono('')).toBe(false)
  })

  it('❌ rechaza undefined o null', () => {
    expect(validarTelefono(null)).toBe(false)
    expect(validarTelefono(undefined)).toBe(false)
  })

  it('❌ rechaza string de solo letras', () => {
    expect(validarTelefono('abcdefghij')).toBe(false)
  })
})

// ══════════════════════════════════════════════════
// 2. validarFecha
// ══════════════════════════════════════════════════
describe('validarFecha', () => {
  it('✅ acepta fecha anterior a hoy', () => {
    expect(validarFecha('1999-05-20')).toBeTruthy()
  })

  it('✅ acepta fecha igual a hoy', () => {
    expect(validarFecha(hoy)).toBeTruthy()
  })

  it('❌ rechaza fecha futura', () => {
    expect(validarFecha('2099-01-01')).toBeFalsy()
  })

  it('❌ rechaza fecha vacía', () => {
    expect(validarFecha('')).toBeFalsy()
  })

  it('❌ rechaza null o undefined', () => {
    expect(validarFecha(null)).toBeFalsy()
    expect(validarFecha(undefined)).toBeFalsy()
  })
})

// ══════════════════════════════════════════════════
// 3. validarCampo (por nombre de campo)
// ══════════════════════════════════════════════════
describe('validarCampo', () => {
  describe('campo: telefono', () => {
    it('✅ no retorna error si el teléfono es válido', () => {
      expect(validarCampo('telefono', '3214556879')).toBe('')
    })

    it('❌ retorna error si el teléfono tiene menos de 10 dígitos', () => {
      expect(validarCampo('telefono', '12345')).toBe('El teléfono debe tener exactamente 10 dígitos')
    })

    it('✅ no retorna error si el valor está vacío (campo opcional en edición)', () => {
      // Si value es vacío, el if(value && ...) no entra
      expect(validarCampo('telefono', '')).toBe('')
    })
  })

  describe('campo: contactoEmergenciaTel', () => {
    it('❌ retorna error si el teléfono de emergencia es inválido', () => {
      expect(validarCampo('contactoEmergenciaTel', '999')).toBe('El teléfono debe tener exactamente 10 dígitos')
    })

    it('✅ no retorna error si es válido', () => {
      expect(validarCampo('contactoEmergenciaTel', '3119900112')).toBe('')
    })
  })

  describe('campo: fechaNacimiento', () => {
    it('❌ retorna error si la fecha es futura', () => {
      expect(validarCampo('fechaNacimiento', '2099-01-01')).toBe('La fecha no puede ser mayor a hoy')
    })

    it('✅ no retorna error si la fecha es válida', () => {
      expect(validarCampo('fechaNacimiento', '1995-03-15')).toBe('')
    })
  })

  describe('campo desconocido', () => {
    it('✅ siempre retorna string vacío para campos no validados', () => {
      expect(validarCampo('nombre', 'cualquier cosa')).toBe('')
      expect(validarCampo('email', 'test@test.com')).toBe('')
    })
  })
})

// ══════════════════════════════════════════════════
// 4. validarFormulario (flujo completo de registro)
// ══════════════════════════════════════════════════
describe('validarFormulario', () => {
  const pacienteValido = {
    id: '1062554433',
    nombre: 'Laura Grijalba Mena',
    fechaNacimiento: '1995-03-15',
    genero: 'F',
    tipoSangre: 'O+',
    telefono: '3214556879',
    email: 'laura@email.com',
    direccion: 'Calle 12 # 3-45',
    ciudad: 'Popayán',
    contactoEmergenciaNombre: 'Pedro Grijalba',
    contactoEmergenciaTel: '3119900112'
  }

  it('✅ aprueba un paciente con todos los datos correctos', () => {
    const result = validarFormulario(pacienteValido, [])
    expect(result.valido).toBe(true)
    expect(result.mensaje).toBe('')
  })

  it('❌ rechaza cuando faltan campos requeridos', () => {
    const incompleto = { ...pacienteValido, nombre: '', genero: '' }
    const result = validarFormulario(incompleto, [])
    expect(result.valido).toBe(false)
    expect(result.mensaje).toBe('Ingrese los datos requeridos en cada campo')
  })

  it('❌ rechaza ID con letras (cédula inválida)', () => {
    const conLetras = { ...pacienteValido, id: 'ABC123' }
    const result = validarFormulario(conLetras, [])
    expect(result.valido).toBe(false)
    expect(result.mensaje).toBe('No se puede agregar')
  })

  it('❌ rechaza teléfono con dígitos insuficientes', () => {
    const telCorto = { ...pacienteValido, telefono: '12345' }
    const result = validarFormulario(telCorto, [])
    expect(result.valido).toBe(false)
    expect(result.errores.telefono).toBeTruthy()
  })

  it('❌ rechaza fecha de nacimiento futura', () => {
    const fechaFutura = { ...pacienteValido, fechaNacimiento: '2099-01-01' }
    const result = validarFormulario(fechaFutura, [])
    expect(result.valido).toBe(false)
    expect(result.errores.fechaNacimiento).toBeTruthy()
  })

  it('❌ rechaza teléfono de emergencia inválido (si fue ingresado)', () => {
    const telEmergMal = { ...pacienteValido, contactoEmergenciaTel: '999' }
    const result = validarFormulario(telEmergMal, [])
    expect(result.valido).toBe(false)
    expect(result.errores.contactoEmergenciaTel).toBeTruthy()
  })

  it('✅ acepta teléfono de emergencia vacío (campo opcional)', () => {
    const sinEmerg = { ...pacienteValido, contactoEmergenciaTel: '' }
    const result = validarFormulario(sinEmerg, [])
    expect(result.valido).toBe(true)
  })

  it('❌ rechaza ID duplicado en la lista de pacientes', () => {
    const existentes = [{ id: '1062554433', nombre: 'Paciente Existente' }]
    const result = validarFormulario(pacienteValido, existentes)
    expect(result.valido).toBe(false)
    expect(result.mensaje).toBe('Datos ya existentes en la base de datos')
  })
})

// ══════════════════════════════════════════════════
// 5. calcularEdad
// ══════════════════════════════════════════════════
describe('calcularEdad', () => {
  it('✅ calcula correctamente la edad de un adulto', () => {
    // Usamos una fecha fija para que la prueba no falle con el tiempo
    const hoyD = new Date()
    const hace30 = new Date(hoyD.getFullYear() - 30, hoyD.getMonth(), hoyD.getDate())
    const fechaStr = hace30.toISOString().split('T')[0]
    expect(calcularEdad(fechaStr)).toBe('30 años')
  })

  it('✅ retorna "-" si no hay fecha', () => {
    expect(calcularEdad('')).toBe('-')
    expect(calcularEdad(null)).toBe('-')
    expect(calcularEdad(undefined)).toBe('-')
  })
})

// ══════════════════════════════════════════════════
// 6. formatGenero
// ══════════════════════════════════════════════════
describe('formatGenero', () => {
  it('✅ "M" → "Masculino"', () => expect(formatGenero('M')).toBe('Masculino'))
  it('✅ "F" → "Femenino"',  () => expect(formatGenero('F')).toBe('Femenino'))
  it('✅ "O" → "Otro"',      () => expect(formatGenero('O')).toBe('Otro'))
  it('✅ valor desconocido → "-"', () => {
    expect(formatGenero('')).toBe('-')
    expect(formatGenero(null)).toBe('-')
    expect(formatGenero('X')).toBe('-')
  })
})

// ══════════════════════════════════════════════════
// 7. huboCambios (detección de edición real)
// ══════════════════════════════════════════════════
describe('huboCambios', () => {
  const original = {
    id: '1062554433', nombre: 'Laura', telefono: '3214556879', email: 'laura@mail.com'
  }

  it('✅ detecta cambio en nombre', () => {
    const editado = { ...original, nombre: 'Laura Modificada' }
    expect(huboCambios(original, editado)).toBe(true)
  })

  it('✅ detecta cambio en teléfono', () => {
    const editado = { ...original, telefono: '3009876543' }
    expect(huboCambios(original, editado)).toBe(true)
  })

  it('❌ no detecta cambios si todo es igual', () => {
    expect(huboCambios(original, { ...original })).toBe(false)
  })

  it('✅ maneja campos con null/undefined vs string vacío', () => {
    const orig = { ...original, email: null }
    const edit = { ...original, email: '' }
    // String(null) === '' → no hay cambio real
    expect(huboCambios(orig, edit)).toBe(false)
  })
})