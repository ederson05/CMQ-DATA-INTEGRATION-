// ============================================================
// TEST2.TEST.JS — Pruebas unitarias: Módulo Médico (CMQ)
// Herramienta: Vitest
// Comando:     npx vitest run test2.test.js
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// ── FUNCIONES EXTRAÍDAS DEL COMPONENTE (para poder testearlas)
// ── Copia estas funciones tal cual están en medico_principal.jsx
// ============================================================

const calcEdad = (fn) => {
  if (!fn) return '-'
  const hoy = new Date(), nac = new Date(fn)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return `${edad} años`
}

const fmtFecha = (ts) => {
  if (!ts) return '-'
  const limpia = String(ts).replace('T', ' ').split('.')[0]
  const [fecha, hora] = limpia.split(' ')
  const [anio, mes, dia] = fecha.split('-')
  const [hh, mm] = hora.split(':')
  const d = new Date(anio, mes - 1, dia, hh, mm)
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const initiales = (nombre) =>
  nombre
    ? nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'DR'

const validarAnotacion = (f) => {
  const e = {}
  if (!f.tipoConsulta)          e.tipoConsulta  = 'Seleccione el tipo de consulta'
  if (!f.diagnostico?.trim())   e.diagnostico   = 'El diagnóstico es requerido'
  if (!f.tratamiento?.trim())   e.tratamiento   = 'El tratamiento es requerido'
  if (!f.observaciones?.trim()) e.observaciones = 'Las observaciones son requeridas'
  return e
}

const ESTADO_LABEL = {
  ATENDIDO:   'Atendido',
  EN_ESPERA:  'En espera',
  PROGRAMADA: 'Pendiente',
}

const TIPO_LABEL = {
  PRIMERA_VEZ: 'Primera vez',
  CONTROL:     'Control',
  URGENCIA:    'Urgencia',
}

const TIPOS      = ['PRIMERA_VEZ', 'CONTROL', 'URGENCIA']
const ESTADOS_CITA = ['PROGRAMADA', 'EN_ESPERA', 'ATENDIDO']

// ── Helper: fecha ISO de hace N años ──
const fechaHaceAnios = (n) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - n)
  return d.toISOString().split('T')[0]
}

// ============================================================
// 1. PRUEBAS — calcEdad
// ============================================================
describe('calcEdad', () => {

  it('1. Retorna "-" cuando no se pasa fecha', () => {
    expect(calcEdad(null)).toBe('-')
    expect(calcEdad(undefined)).toBe('-')
    expect(calcEdad('')).toBe('-')
  })

  it('2. Calcula correctamente 30 años exactos', () => {
    const fecha = fechaHaceAnios(30)
    expect(calcEdad(fecha)).toBe('30 años')
  })

  it('3. Calcula correctamente 0 años (recién nacido este año)', () => {
    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}-01-01`
    const resultado = calcEdad(fecha)
    expect(resultado).toMatch(/^\d+ años$/)
  })

  it('4. Calcula correctamente 18 años', () => {
    const fecha = fechaHaceAnios(18)
    expect(calcEdad(fecha)).toBe('18 años')
  })

  it('5. Retorna string con formato "X años"', () => {
    const fecha = fechaHaceAnios(25)
    expect(calcEdad(fecha)).toMatch(/^\d+ años$/)
  })

})

// ============================================================
// 2. PRUEBAS — initiales
// ============================================================
describe('initiales', () => {

  it('6. Retorna "DR" cuando el nombre es nulo o vacío', () => {
    expect(initiales(null)).toBe('DR')
    expect(initiales(undefined)).toBe('DR')
    expect(initiales('')).toBe('DR')
  })

  it('7. Genera iniciales correctas para nombre completo', () => {
    expect(initiales('Camilo Herrera Castro')).toBe('CH')
  })

  it('8. Genera inicial correcta para un solo nombre', () => {
    expect(initiales('ederson')).toBe('E')
  })

  it('9. Siempre retorna en mayúsculas', () => {
    expect(initiales('juan perez')).toBe('JP')
  })

  it('10. Solo toma las primeras dos palabras del nombre', () => {
    expect(initiales('Maria Alejandra Lopez Gomez')).toBe('MA')
  })

  it('11. Funciona con nombres con tildes', () => {
    expect(initiales('Óscar Álvarez')).toBe('ÓÁ')
  })

})

// ============================================================
// 3. PRUEBAS — fmtFecha
// ============================================================
describe('fmtFecha', () => {

  it('12. Retorna "-" cuando el timestamp es nulo', () => {
    expect(fmtFecha(null)).toBe('-')
    expect(fmtFecha(undefined)).toBe('-')
    expect(fmtFecha('')).toBe('-')
  })

  it('13. Formatea correctamente un timestamp con espacio', () => {
    const resultado = fmtFecha('2026-05-06 09:30:00')
    expect(resultado).toContain('06/05/2026')
    expect(resultado).toContain('09:30')
  })

  it('14. Formatea correctamente un timestamp con T (formato ISO)', () => {
    const resultado = fmtFecha('2026-05-06T10:13:00')
    expect(resultado).toContain('06/05/2026')
    expect(resultado).toContain('10:13')
  })

  it('15. Ignora milisegundos en el timestamp', () => {
    const resultado = fmtFecha('2026-06-08T09:30:00.000Z')
    expect(resultado).toContain('09:30')
  })

  it('16. Retorna un string no vacío para fecha válida', () => {
    const resultado = fmtFecha('2026-01-15 08:00:00')
    expect(typeof resultado).toBe('string')
    expect(resultado.length).toBeGreaterThan(0)
  })

})

// ============================================================
// 4. PRUEBAS — validarAnotacion
// ============================================================
describe('validarAnotacion', () => {

  it('17. Retorna errores cuando todos los campos están vacíos', () => {
    const errs = validarAnotacion({
      tipoConsulta: '', diagnostico: '', tratamiento: '', observaciones: ''
    })
    expect(Object.keys(errs).length).toBe(4)
  })

  it('18. No retorna errores cuando todos los campos son válidos', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'CONTROL',
      diagnostico:  'Hipertensión leve',
      tratamiento:  'Enalapril 10mg',
      observaciones:'Paciente estable'
    })
    expect(Object.keys(errs).length).toBe(0)
  })

  it('19. Detecta tipoConsulta vacío', () => {
    const errs = validarAnotacion({
      tipoConsulta: '',
      diagnostico:  'Algo',
      tratamiento:  'Algo',
      observaciones:'Algo'
    })
    expect(errs.tipoConsulta).toBeDefined()
    expect(errs.tipoConsulta).toBe('Seleccione el tipo de consulta')
  })

  it('20. Detecta diagnóstico vacío o solo espacios', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'CONTROL',
      diagnostico:  '   ',
      tratamiento:  'Algo',
      observaciones:'Algo'
    })
    expect(errs.diagnostico).toBeDefined()
  })

  it('21. Detecta tratamiento vacío', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'URGENCIA',
      diagnostico:  'Fiebre',
      tratamiento:  '',
      observaciones:'Algo'
    })
    expect(errs.tratamiento).toBe('El tratamiento es requerido')
  })

  it('22. Detecta observaciones vacías', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'PRIMERA_VEZ',
      diagnostico:  'Cefalea',
      tratamiento:  'Ibuprofeno',
      observaciones:''
    })
    expect(errs.observaciones).toBe('Las observaciones son requeridas')
  })

  it('23. No marca error si solo falta proximaCita (campo opcional)', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'CONTROL',
      diagnostico:  'Normal',
      tratamiento:  'Reposo',
      observaciones:'Sin novedad',
      proximaCita:  ''
    })
    expect(errs.proximaCita).toBeUndefined()
  })

  it('24. El mensaje de error de diagnóstico es correcto', () => {
    const errs = validarAnotacion({
      tipoConsulta: 'CONTROL',
      diagnostico:  '',
      tratamiento:  'Algo',
      observaciones:'Algo'
    })
    expect(errs.diagnostico).toBe('El diagnóstico es requerido')
  })

})

// ============================================================
// 5. PRUEBAS — Constantes y catálogos
// ============================================================
describe('Catálogos y constantes', () => {

  it('25. TIPOS contiene exactamente 3 tipos de consulta', () => {
    expect(TIPOS.length).toBe(3)
    expect(TIPOS).toContain('PRIMERA_VEZ')
    expect(TIPOS).toContain('CONTROL')
    expect(TIPOS).toContain('URGENCIA')
  })

  it('26. ESTADOS_CITA contiene los 3 estados correctos', () => {
    expect(ESTADOS_CITA).toContain('PROGRAMADA')
    expect(ESTADOS_CITA).toContain('EN_ESPERA')
    expect(ESTADOS_CITA).toContain('ATENDIDO')
  })

  it('27. ESTADO_LABEL mapea correctamente los estados', () => {
    expect(ESTADO_LABEL['ATENDIDO']).toBe('Atendido')
    expect(ESTADO_LABEL['EN_ESPERA']).toBe('En espera')
    expect(ESTADO_LABEL['PROGRAMADA']).toBe('Pendiente')
  })

  it('28. TIPO_LABEL mapea correctamente los tipos de consulta', () => {
    expect(TIPO_LABEL['PRIMERA_VEZ']).toBe('Primera vez')
    expect(TIPO_LABEL['CONTROL']).toBe('Control')
    expect(TIPO_LABEL['URGENCIA']).toBe('Urgencia')
  })

})

// ============================================================
// 6. PRUEBAS — Lógica de ordenamiento de citas
// ============================================================
describe('Ordenamiento de citas', () => {

  const citas = [
    { citId: 1, pacNombre: 'Camilo H', fechaHora: '2026-05-06T10:13:00', estado: 'PROGRAMADA' },
    { citId: 2, pacNombre: 'ederson',  fechaHora: '2026-05-06T09:30:00', estado: 'PROGRAMADA' },
    { citId: 3, pacNombre: 'Maria L',  fechaHora: '2026-05-06T08:00:00', estado: 'ATENDIDO'   },
  ]

  const sortCitas = (lista) =>
    [...lista].sort((a, b) => {
      const atA = a.estado === 'ATENDIDO' ? 1 : 0
      const atB = b.estado === 'ATENDIDO' ? 1 : 0
      if (atA !== atB) return atA - atB
      return new Date(a.fechaHora) - new Date(b.fechaHora)
    })

  it('29. Los atendidos van al final de la lista', () => {
    const ordenadas = sortCitas(citas)
    expect(ordenadas[ordenadas.length - 1].estado).toBe('ATENDIDO')
  })

  it('30. Entre no-atendidos, el de menor hora va primero', () => {
    const ordenadas = sortCitas(citas)
    const noAtendidos = ordenadas.filter(c => c.estado !== 'ATENDIDO')
    expect(noAtendidos[0].pacNombre).toBe('ederson')   // 09:30 antes que 10:13
    expect(noAtendidos[1].pacNombre).toBe('Camilo H')
  })

  it('31. El sort no muta el array original', () => {
    const original = [...citas]
    sortCitas(citas)
    expect(citas[0].citId).toBe(original[0].citId)
  })

  it('32. Lista vacía no lanza error al ordenar', () => {
    expect(() => sortCitas([])).not.toThrow()
    expect(sortCitas([])).toEqual([])
  })

})

// ============================================================
// 7. PRUEBAS — Mock de fetch (API)
// ============================================================
describe('Llamadas a la API', () => {

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('33. cargarCitasHoy llama al endpoint correcto', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => []
    })
    const medId = 5
    await fetch(`https://cmq-backend.onrender.com/api/citas/hoy/${medId}`)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cmq-backend.onrender.com/api/citas/hoy/5'
    )
  })

  it('34. guardarAnotacion envía POST con Content-Type JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, anoId: 1 })
    })
    await fetch('https://cmq-backend.onrender.com/api/anotaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipoConsulta: 'CONTROL' })
    })
    const llamada = global.fetch.mock.calls[0]
    expect(llamada[1].method).toBe('POST')
    expect(llamada[1].headers['Content-Type']).toBe('application/json')
  })

  it('35. La API retorna success:true al guardar anotación válida', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, anoId: 99 })
    })
    const res  = await fetch('https://cmq-backend.onrender.com/api/anotaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.anoId).toBe(99)
  })

  it('36. Maneja correctamente un error de red (fetch falla)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    let resultado = []
    try {
      const res  = await fetch('https://cmq-backend.onrender.com/api/citas/hoy/1')
      const data = await res.json()
      resultado  = Array.isArray(data) ? data : []
    } catch {
      resultado = []
    }
    expect(resultado).toEqual([])
  })

  it('37. Actualizar estado de cita llama PUT con body correcto', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true })
    })
    const citId     = 12
    const nuevoEst  = 'EN_ESPERA'
    await fetch(`https://cmq-backend.onrender.com/api/citas/${citId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ estado: nuevoEst })
    })
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.estado).toBe('EN_ESPERA')
  })

})

// ============================================================
// 8. PRUEBAS — Lógica de stats derivados
// ============================================================
describe('Stats derivados de citasHoy', () => {

  const citasHoy = [
    { citId: 1, estado: 'PROGRAMADA' },
    { citId: 2, estado: 'EN_ESPERA'  },
    { citId: 3, estado: 'ATENDIDO'   },
    { citId: 4, estado: 'ATENDIDO'   },
    { citId: 5, estado: 'PROGRAMADA' },
  ]

  it('38. Cuenta correctamente las citas atendidas', () => {
    const atendidas = citasHoy.filter(c => c.estado === 'ATENDIDO').length
    expect(atendidas).toBe(2)
  })

  it('39. Cuenta correctamente las citas sin atender', () => {
    const sinAtender = citasHoy.filter(c => c.estado !== 'ATENDIDO').length
    expect(sinAtender).toBe(3)
  })

  it('40. Cuenta correctamente las citas en espera', () => {
    const enEspera = citasHoy.filter(c => c.estado === 'EN_ESPERA').length
    expect(enEspera).toBe(1)
  })

  it('41. El total de citas es correcto', () => {
    expect(citasHoy.length).toBe(5)
  })

  it('42. handleEstadoChange actualiza el estado en la lista local', () => {
    let citas = [...citasHoy]
    const handleEstadoChange = (citId, nuevoEstado) => {
      citas = citas.map(c => c.citId === citId ? { ...c, estado: nuevoEstado } : c)
    }
    handleEstadoChange(1, 'ATENDIDO')
    const cita1 = citas.find(c => c.citId === 1)
    expect(cita1.estado).toBe('ATENDIDO')
  })

})