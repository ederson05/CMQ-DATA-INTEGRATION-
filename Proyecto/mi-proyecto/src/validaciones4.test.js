// validaciones4.test.js — Pruebas unitarias módulo Urgencias
// validaciones4.test.js — Pruebas unitarias módulo Urgencias
import { describe, test, expect } from 'vitest'
import {
  soloLetras,
    soloNumeros10,
    emailValido,
    fechaNacimientoValida,
    validarFormPNI
} from './validaciones4.js'


// ─────────────────────────────────────────
// soloLetras
// ─────────────────────────────────────────
describe('soloLetras', () => {
  // Casos válidos
  test('acepta nombre simple',            () => expect(soloLetras('Juan')).toBe(true))
  test('acepta nombre con tilde',         () => expect(soloLetras('María')).toBe(true))
  test('acepta nombre compuesto',         () => expect(soloLetras('Juan Carlos')).toBe(true))
  test('acepta ñ y ü',                    () => expect(soloLetras('Núñez Güell')).toBe(true))
  test('acepta solo espacios entre palabras', () => expect(soloLetras('Ana Lucia Mora')).toBe(true))

  // Casos inválidos
  test('rechaza número en nombre',        () => expect(soloLetras('Juan1')).toBe(false))
  test('rechaza carácter especial',       () => expect(soloLetras('Juan@')).toBe(false))
  test('rechaza string vacío',            () => expect(soloLetras('')).toBe(false))
  test('rechaza solo espacios',           () => expect(soloLetras('   ')).toBe(false))
  test('rechaza guion',                   () => expect(soloLetras('Juan-Carlos')).toBe(false))
})

// ─────────────────────────────────────────
// soloNumeros10
// ─────────────────────────────────────────
describe('soloNumeros10', () => {
  // Casos válidos
  test('acepta teléfono de 10 dígitos',   () => expect(soloNumeros10('3214556879')).toBe(true))
  test('acepta teléfono que empieza en 3',() => expect(soloNumeros10('3001234567')).toBe(true))

  // Casos inválidos
  test('rechaza 9 dígitos',               () => expect(soloNumeros10('321455687')).toBe(false))
  test('rechaza 11 dígitos',              () => expect(soloNumeros10('32145568790')).toBe(false))
  test('rechaza letras',                  () => expect(soloNumeros10('321455687a')).toBe(false))
  test('rechaza vacío',                   () => expect(soloNumeros10('')).toBe(false))
  test('rechaza con espacios',            () => expect(soloNumeros10('321 456 789')).toBe(false))
  test('rechaza con guiones',             () => expect(soloNumeros10('321-456-789')).toBe(false))
})

// ─────────────────────────────────────────
// emailValido
// ─────────────────────────────────────────
describe('emailValido', () => {
  // Casos válidos
  test('acepta email básico',             () => expect(emailValido('correo@email.com')).toBe(true))
  test('acepta email con punto',          () => expect(emailValido('juan.garcia@uni.edu.co')).toBe(true))
  test('acepta email con guion',          () => expect(emailValido('juan-garcia@email.com')).toBe(true))
  test('acepta email con guion bajo',     () => expect(emailValido('juan_garcia@email.com')).toBe(true))
  test('acepta vacío (campo opcional)',   () => expect(emailValido('')).toBe(true))
  test('acepta undefined (opcional)',     () => expect(emailValido(undefined)).toBe(true))

  // Casos inválidos
  test('rechaza sin @',                   () => expect(emailValido('correosinato.com')).toBe(false))
  test('rechaza sin dominio',             () => expect(emailValido('correo@')).toBe(false))
  test('rechaza sin extensión',           () => expect(emailValido('correo@email')).toBe(false))
  test('rechaza con tilde',               () => expect(emailValido('córreo@email.com')).toBe(false))
  test('rechaza con espacio',             () => expect(emailValido('co rreo@email.com')).toBe(false))
})

// ─────────────────────────────────────────
// fechaNacimientoValida
// ─────────────────────────────────────────
describe('fechaNacimientoValida', () => {
  const hoy = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)

  // Casos válidos
  test('acepta fecha pasada',             () => expect(fechaNacimientoValida('1990-05-15')).toBe(true))
  test('acepta ayer',                     () => expect(fechaNacimientoValida(fmt(ayer))).toBe(true))
  test('acepta hoy',                      () => expect(fechaNacimientoValida(fmt(hoy))).toBe(true))

  // Casos inválidos
  test('rechaza mañana',                  () => expect(fechaNacimientoValida(fmt(manana))).toBe(false))
  test('rechaza fecha futura lejana',     () => expect(fechaNacimientoValida('2099-01-01')).toBe(false))
  test('rechaza vacío',                   () => expect(fechaNacimientoValida('')).toBe(false))
  test('rechaza null',                    () => expect(fechaNacimientoValida(null)).toBe(false))
  test('rechaza undefined',               () => expect(fechaNacimientoValida(undefined)).toBe(false))
})

// ─────────────────────────────────────────
// validarFormPNI — formulario completo
// ─────────────────────────────────────────
const formValido = {
  nombre: 'Laura Grijalba',
  telefono: '3214556879',
  fechaNacimiento: '1995-08-20',
  genero: 'F',
  tipoSangre: 'O+',
  email: '',
  direccion: 'Calle 12 # 3-45',
  ciudad: 'Popayán',
  emergenciaNombre: '',
  emergenciaTel: ''
}

describe('validarFormPNI — casos válidos', () => {
  test('formulario completo sin errores',
    () => expect(Object.keys(validarFormPNI(formValido))).toHaveLength(0))

  test('acepta email opcional vacío',
    () => expect(validarFormPNI({ ...formValido, email: '' })).not.toHaveProperty('email'))

  test('acepta email opcional con valor válido',
    () => expect(validarFormPNI({ ...formValido, email: 'correo@test.com' })).not.toHaveProperty('email'))

  test('acepta contacto emergencia vacío',
    () => expect(validarFormPNI({ ...formValido, emergenciaNombre: '', emergenciaTel: '' }))
      .not.toHaveProperty('emergenciaTel'))

  test('acepta contacto emergencia con datos válidos',
    () => expect(validarFormPNI({ ...formValido, emergenciaNombre: 'Pedro Mora', emergenciaTel: '3119900112' }))
      .not.toHaveProperty('emergenciaTel'))
})

describe('validarFormPNI — nombre', () => {
  test('error si nombre vacío',
    () => expect(validarFormPNI({ ...formValido, nombre: '' })).toHaveProperty('nombre'))
  test('error si nombre tiene números',
    () => expect(validarFormPNI({ ...formValido, nombre: 'Laura123' })).toHaveProperty('nombre'))
  test('error si nombre tiene caracteres especiales',
    () => expect(validarFormPNI({ ...formValido, nombre: 'Laura@' })).toHaveProperty('nombre'))
})

describe('validarFormPNI — teléfono', () => {
  test('error si teléfono vacío',
    () => expect(validarFormPNI({ ...formValido, telefono: '' })).toHaveProperty('telefono'))
  test('error si teléfono tiene 9 dígitos',
    () => expect(validarFormPNI({ ...formValido, telefono: '321455687' })).toHaveProperty('telefono'))
  test('error si teléfono tiene letras',
    () => expect(validarFormPNI({ ...formValido, telefono: '32145abc79' })).toHaveProperty('telefono'))
})

describe('validarFormPNI — fecha de nacimiento', () => {
  test('error si fecha vacía',
    () => expect(validarFormPNI({ ...formValido, fechaNacimiento: '' })).toHaveProperty('fechaNacimiento'))
  test('error si fecha es futura',
    () => expect(validarFormPNI({ ...formValido, fechaNacimiento: '2099-01-01' })).toHaveProperty('fechaNacimiento'))
})

describe('validarFormPNI — género y tipo de sangre', () => {
  test('error si género vacío',
    () => expect(validarFormPNI({ ...formValido, genero: '' })).toHaveProperty('genero'))
  test('error si tipo de sangre vacío',
    () => expect(validarFormPNI({ ...formValido, tipoSangre: '' })).toHaveProperty('tipoSangre'))
})

describe('validarFormPNI — dirección y ciudad', () => {
  test('error si dirección vacía',
    () => expect(validarFormPNI({ ...formValido, direccion: '' })).toHaveProperty('direccion'))
  test('error si ciudad vacía',
    () => expect(validarFormPNI({ ...formValido, ciudad: '' })).toHaveProperty('ciudad'))
  test('error si ciudad tiene números',
    () => expect(validarFormPNI({ ...formValido, ciudad: 'Bogota123' })).toHaveProperty('ciudad'))
})

describe('validarFormPNI — email opcional', () => {
  test('error si email tiene tilde',
    () => expect(validarFormPNI({ ...formValido, email: 'córreo@test.com' })).toHaveProperty('email'))
  test('error si email sin @',
    () => expect(validarFormPNI({ ...formValido, email: 'correosinato.com' })).toHaveProperty('email'))
})

describe('validarFormPNI — contacto emergencia opcional', () => {
  test('error si teléfono emergencia tiene menos de 10 dígitos',
    () => expect(validarFormPNI({ ...formValido, emergenciaTel: '123' })).toHaveProperty('emergenciaTel'))
  test('error si nombre emergencia tiene números',
    () => expect(validarFormPNI({ ...formValido, emergenciaNombre: 'Pedro123' })).toHaveProperty('emergenciaNombre'))
  test('sin error si emergencia completamente vacía',
    () => {
      const res = validarFormPNI({ ...formValido, emergenciaNombre: '', emergenciaTel: '' })
      expect(res).not.toHaveProperty('emergenciaNombre')
      expect(res).not.toHaveProperty('emergenciaTel')
    })
})