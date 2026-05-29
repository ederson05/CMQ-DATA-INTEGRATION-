import { useState, useEffect } from 'react'
import {
  FiCalendar, FiUsers, FiFileText,
  FiEdit2, FiSearch, FiLogOut
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './citas_medicas.css'

//local
//const API = 'http://localhost:3001/api'

//API
const API = 'https://cmq-backend.onrender.com/api'


const pad = n => String(n).padStart(2, '0')

const ahoraPlus3 = () => {
  const d = new Date()
  d.setHours(d.getHours() + 3)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const maxFecha = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 4)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T17:00`
}

const validarDisponibilidad = (fechaSeleccionada, medicoId, citasExistentes) => {
  const sel = new Date(fechaSeleccionada)
  const hora = sel.getHours() + sel.getMinutes() / 60

  if (hora < 7 || hora >= 17) {
    return { disponible: false, mensaje: 'El médico solo atiende de 7:00am a 5:00pm' }
  }

  const citasDelMedico = citasExistentes.filter(c =>
    String(c.medId) === String(medicoId) &&
    c.fecha.split('T')[0] === fechaSeleccionada.split('T')[0] &&
    c.estado !== 'CANCELADA'
  )

  const choque = citasDelMedico.find(c => {
    const existente = new Date(c.fecha.replace(' ', 'T'))
    const diff = Math.abs(sel - existente) / 60000
    return diff < 30
  })

  if (choque) {
    const ultimaCita = citasDelMedico
      .map(c => new Date(c.fecha.replace(' ', 'T')))
      .sort((a, b) => b - a)[0]
    const hh = pad(ultimaCita.getHours())
    const mm = pad(ultimaCita.getMinutes())
    return {
      disponible: false,
      mensaje: `Horario ocupado. La última cita de ese médico ese día es a las ${hh}:${mm}. Elija 30 min después.`
    }
  }

  return { disponible: true }
}

const ESTADOS = [
  { valor: 'PROGRAMADA', label: 'Programada',  bg: '#eff6ff', color: '#3b82f6' },
  { valor: 'EN_ESPERA',  label: 'En espera',   bg: '#fff7ed', color: '#f97316' },
  { valor: 'EN_TRIAGE',  label: 'En triage',   bg: '#fdf4ff', color: '#9333ea' },
  { valor: 'ATENDIDO',   label: 'Atendido',    bg: '#f0fdf4', color: '#059669' },
  { valor: 'CANCELADA',  label: 'Cancelada',   bg: '#fef2f2', color: '#ef4444' },
]

const NIVELES = [
  { valor: 'LEVE',    label: '🟢 Leve' },
  { valor: 'ESTABLE', label: '🟡 Estable' },
  { valor: 'CRITICO', label: '🔴 Crítico' },
]

const getBadgeEstado = (estado) => {
  const e = ESTADOS.find(e => e.valor === estado) || ESTADOS[0]
  return (
    <span style={{
      background: e.bg, color: e.color,
      padding: '2px 10px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 700
    }}>{e.label}</span>
  )
}

const getBadgeNivel = (nivel) => {
  const colores = {
    LEVE:    { bg: '#f0fdf4', color: '#22c55e' },
    ESTABLE: { bg: '#fefce8', color: '#ca8a04' },
    CRITICO: { bg: '#fef2f2', color: '#ef4444' },
  }
  const c = colores[nivel] || colores.ESTABLE
  const emoji = nivel === 'LEVE' ? '🟢' : nivel === 'CRITICO' ? '🔴' : '🟡'
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 10px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 700
    }}>{emoji} {nivel}</span>
  )
}

function ErrorField({ msg }) {
  if (!msg) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
      marginTop: '5px', padding: '6px 10px', background: '#fff5f5',
      border: '1px solid #fca5a5', borderRadius: '6px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px',
        color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>!</span>
      <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>{msg}</span>
    </div>
  )
}

function CitasMedicas() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [citaEditando, setCitaEditando] = useState(null)
  const [erroresModal, setErroresModal] = useState({})
  const [exitoMsg, setExitoMsg] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [citas, setCitas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [errores, setErrores] = useState({})
  const [intento, setIntento] = useState(false)
  const [nuevaCita, setNuevaCita] = useState({
    identificacion: '', medico: '', fecha: '', motivo: ''
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [resCitas, resMedicos, resPacientes] = await Promise.all([
        fetch(`${API}/citas`),
        fetch(`${API}/medicos`),
        fetch(`${API}/pacientes`)
      ])


      /*
      const dataCitas     = await resCitas.json()
      const dataMedicos   = await resMedicos.json()
      const dataPacientes = await resPacientes.json()

      setCitas(dataCitas.map(row => ({
        citId:         row[0],
        pacDocumento:  String(row[1]),
        nombre:        row[2],
        medId:         row[3],
        medico:        row[4],
        fecha:         row[5] ? row[5].split('.')[0] : '',
        motivo:        row[6] || '',
        estado:        row[7] || 'PROGRAMADA',
        nivelPaciente: row[8] || 'ESTABLE'
      })))

      setMedicos(dataMedicos.map(row => ({
        id: row[0], nombre: row[1], especialidad: row[2]
      })))

      setPacientes(dataPacientes.map(row => ({
        id: String(row[0]), nombre: row[1]
      })))
*/
const dataCitas = await resCitas.json()
const dataMedicos = await resMedicos.json()
const dataPacientes = await resPacientes.json()

setCitas(Array.isArray(dataCitas) ? dataCitas.map(row => ({
  citId:         row[0],
  pacDocumento:  String(row[1]),
  nombre:        row[2],
  medId:         row[3],
  medico:        row[4],
  fecha:         row[5] ? row[5].split('.')[0] : '',
  motivo:        row[6] || '',
  estado:        row[7] || 'PROGRAMADA',
  nivelPaciente: row[8] || 'ESTABLE'
})) : [])

setMedicos(Array.isArray(dataMedicos) ? dataMedicos.map(row => ({
  id: row[0], nombre: row[1], especialidad: row[2]
})) : [])

setPacientes(Array.isArray(dataPacientes) ? dataPacientes.map(row => ({
  id: String(row[0]), nombre: row[1]
})) : [])




    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  const formatDate = (date) => date.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const formatTime = (date) => date.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  const formatFecha = (fechaStr) => {
  if (!fechaStr) return '-'
  const limpia = fechaStr.replace('T', ' ').split('.')[0]
  const [fecha, hora] = limpia.split(' ')
  const [anio, mes, dia] = fecha.split('-')
  const [hh, mm] = hora.split(':')
  const d = new Date(anio, mes - 1, dia, hh, mm)
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

  const handleInputCita = (e) => {
  const { name, value } = e.target
  setNuevaCita(prev => ({ ...prev, [name]: value }))
  let error = ''
  if (name === 'fecha' && value) {
    if (value < ahoraPlus3())
      error = 'La fecha mínima es 3 horas desde ahora'
    else if (nuevaCita.medico) {
      const disp = validarDisponibilidad(value, nuevaCita.medico, citas)
      if (!disp.disponible) error = disp.mensaje
    }
  }
  if (name === 'medico' && nuevaCita.fecha) {
    const disp = validarDisponibilidad(nuevaCita.fecha, value, citas)
    if (!disp.disponible) error = disp.mensaje
    setErrores(prev => ({ ...prev, fecha: error }))
    return
  }
  setErrores(prev => ({ ...prev, [name]: error }))
}

  const handleConfirmarCita = async (e) => {
    e.preventDefault()
    setIntento(true)

    const errs = {}
    if (!nuevaCita.identificacion.trim()) errs.identificacion = 'La identificación del paciente es obligatoria'
    if (!nuevaCita.medico) errs.medico = 'Debes seleccionar un médico'
    if (!nuevaCita.fecha) {
      errs.fecha = 'La fecha y hora son obligatorias'
    } else if (nuevaCita.fecha < ahoraPlus3()) {
      errs.fecha = 'La fecha mínima es 3 horas desde ahora'
    } else {
      const disp = validarDisponibilidad(nuevaCita.fecha, nuevaCita.medico, citas)
      if (!disp.disponible) errs.fecha = disp.mensaje
    }
    if (!nuevaCita.motivo.trim()) errs.motivo = 'El motivo de consulta es obligatorio'

    if (nuevaCita.identificacion.trim()) {
      const paciente = pacientes.find(p => p.id === nuevaCita.identificacion.trim())
      if (!paciente) errs.identificacion = 'No se encontró ningún paciente con esa identificación'
    }

    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const paciente = pacientes.find(p => p.id === nuevaCita.identificacion.trim())
    const medico   = medicos.find(m => String(m.id) === nuevaCita.medico)

    const duplicada = citas.find(c =>
      c.pacDocumento === nuevaCita.identificacion.trim() &&
      c.medId === parseInt(nuevaCita.medico) &&
      c.fecha.split('T')[0] === nuevaCita.fecha.split('T')[0]
    )
    if (duplicada) {
      setErrores(prev => ({ ...prev, identificacion: 'Este paciente ya tiene una cita con ese médico en esa fecha' }))
      return
    }

    try {
      const res = await fetch(`${API}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacDocumento:  nuevaCita.identificacion.trim(),
          medId:         parseInt(nuevaCita.medico),
          fechaHora:     nuevaCita.fecha,
          motivo:        nuevaCita.motivo,
          nivelPaciente: 'ESTABLE'
        })
      })
      const data = await res.json()
      if (data.success) {
        await cargarDatos()
        setNuevaCita({ identificacion: '', medico: '', fecha: '', motivo: '' })
        setErrores({})
        setIntento(false)
        setExitoMsg(`✅ Cita registrada — ${paciente.nombre} con ${medico?.nombre} el ${formatFecha(nuevaCita.fecha)}`)
        setTimeout(() => setExitoMsg(''), 5000)
      } else {
        setErrores({ general: data.error || 'Error al registrar la cita' })
      }
    } catch {
      setErrores({ general: 'Error conectando al servidor' })
    }
  }

  const handleEditarCita = (cita) => setCitaEditando({ ...cita })

  const handleGuardarCita = async () => {
    const errsM = {}
    if (!citaEditando.medId) errsM.medId = 'Selecciona un médico'
    if (!citaEditando.fecha) errsM.fecha = 'Selecciona una fecha'
    else if (citaEditando.estado !== 'CANCELADA' && citaEditando.fecha < ahoraPlus3())
      errsM.fecha = 'La fecha mínima es 3 horas desde ahora'
    if (Object.keys(errsM).length > 0) { setErroresModal(errsM); return }
    setErroresModal({})

    try {
      const res = await fetch(`${API}/citas/${citaEditando.citId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medId:         citaEditando.medId,
          fechaHora:     citaEditando.fecha,
          estado:        citaEditando.estado,
          nivelPaciente: citaEditando.nivelPaciente
        })
      })
      const data = await res.json()
      if (data.success) {
        await cargarDatos()
        setCitaEditando(null)
        setErroresModal({})
        setExitoMsg('✅ Cita modificada exitosamente')
        setTimeout(() => setExitoMsg(''), 4000)
      } else {
        setErroresModal({ general: data.error || 'Error al guardar' })
      }
    } catch {
      setErroresModal({ general: 'Error conectando al servidor' })
    }
  }

  const citasFiltradas = citas.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.pacDocumento.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',        count: pacientes.length, icon: <FiUsers />,    path: '/secretaria' },
    { id: 'citas',     name: 'Citas Médicas',    count: citas.length,     icon: <FiCalendar />, path: '/citas' },
    { id: 'historia',  name: 'Historia Clínica', count: 2,                icon: <FiFileText />, path: '/historia' },
  ]

  return (
    <div className="citas-container">

      <header className="main-header">
        <div className="header-left">
          <div className="logo-icon">+</div>
          <div className="hospital-info">
            <h1>Hospital CMQ</h1>
            <p>SISTEMA DE INFORMACIÓN CLÍNICA</p>
            <span className="version">v2.41 - Grace OS</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={() => navigate('/')}>
            <FiLogOut /> Cerrar sesión
          </button>
          <div className="datetime-box">
            <span className="current-date">{formatDate(currentTime)}</span>
            <span className="current-time">{formatTime(currentTime)}</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">AD</div>
            <span>Secretaria</span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h3>MÓDULOS</h3>
          <nav className="modules-nav">
            {modules.map(mod => (
              <button key={mod.id}
                className={`module-item ${mod.id === 'citas' ? 'active' : ''}`}
                onClick={() => navigate(mod.path)}>
                <span className="module-icon">{mod.icon}</span>
                <span className="module-name">{mod.name}</span>
                <span className="module-count">{mod.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="content-area">
          <div className="page-header">
            <h2>Citas Médicas</h2>
            <p>Programación y consulta de citas con especialistas</p>
          </div>

          <div className="citas-sections">

            {/* PROGRAMAR CITA */}
            <div className="form-section">
              <h3><FiCalendar className="section-icon" /> Programar Cita</h3>

              {exitoMsg && (
                <div style={{
                  position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 18px', background: '#f0fdf4',
                  border: '1px solid #86efac', borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  animation: 'fadeInDown .3s ease'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '24px', height: '24px', background: '#22c55e',
                    borderRadius: '50%', color: 'white', fontSize: '13px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>{exitoMsg}</span>
                </div>
              )}

              {errores.general && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5',
                  borderRadius: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '18px' }}>❌</span>
                  <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{errores.general}</span>
                </div>
              )}

              <form onSubmit={handleConfirmarCita} className="cita-form">

                <div className="form-group">
                  <label>IDENTIFICACIÓN DEL PACIENTE *</label>
                  <input type="text" name="identificacion" placeholder="Ej. 1088156632"
                    value={nuevaCita.identificacion} onChange={handleInputCita}
                    style={{ borderColor: errores.identificacion ? '#ef4444' : '', background: errores.identificacion ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.identificacion} />
                </div>

                <div className="form-group">
                  <label>MÉDICO / ESPECIALISTA *</label>
                  <select name="medico" value={nuevaCita.medico} onChange={handleInputCita}
                    style={{ borderColor: errores.medico ? '#ef4444' : '', background: errores.medico ? '#fff5f5' : '' }}>
                    <option value="">Seleccione un médico</option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} — {m.especialidad}</option>
                    ))}
                  </select>
                  <ErrorField msg={errores.medico} />
                </div>

                <div className="form-group">
                  <label>FECHA Y HORA *</label>
                  <input type="datetime-local" name="fecha"
                    min={ahoraPlus3()} max={maxFecha()}
                    value={nuevaCita.fecha} onChange={handleInputCita}
                    style={{ borderColor: errores.fecha ? '#ef4444' : '', background: errores.fecha ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.fecha} />
                </div>

                <div className="form-group">
                  <label>MOTIVO DE CONSULTA *</label>
                  <input type="text" name="motivo"
                    placeholder="Ej. Dolor de cabeza, control rutinario..."
                    value={nuevaCita.motivo} onChange={handleInputCita}
                    style={{ borderColor: errores.motivo ? '#ef4444' : '', background: errores.motivo ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.motivo} />
                </div>

                <button type="submit" className="btn-confirmar">
                  <FiCalendar /> Confirmar Cita
                </button>
              </form>
            </div>

            {/* REGISTRO DE CITAS */}
            <div className="directory-section">
              <div className="directory-header">
                <h3><FiCalendar className="section-icon" /> Registro de Citas</h3>
                <div className="search-inline">
                  <input type="text" placeholder="Búsqueda por nombre o ID..."
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                  <button className="btn-buscar"><FiSearch /> Buscar</button>
                </div>
              </div>
              <div className="citas-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>PACIENTE</th><th>MÉDICO</th>
                      <th>FECHA</th><th>ESTADO</th><th>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((c) => (
                      <tr key={c.citId}>
                        <td>{c.pacDocumento}</td>
                        <td>{c.nombre}</td>
                        <td>{c.medico}</td>
                        <td>{formatFecha(c.fecha)}</td>
                        <td>{getBadgeEstado(c.estado)}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditarCita(c)}>
                            <FiEdit2 size={12} /> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {citasFiltradas.length === 0 && (
                      <tr><td colSpan="6" className="no-results">No se encontraron citas</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="main-footer">
        <span>CMQ - Módulo Clínica</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {formatTime(currentTime)}
        </span>
      </footer>

      {/* MODAL EDITAR CITA */}
      {citaEditando && (
        <div className="modal-overlay" onClick={() => setCitaEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiCalendar size={18} /></div>
                <div><h3>Editar cita médica</h3><p>Modifica la información de la cita</p></div>
              </div>
              <button className="modal-close" onClick={() => setCitaEditando(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ID DEL PACIENTE</label>
                <input type="text" value={citaEditando.pacDocumento} disabled />
              </div>
              <div className="form-group">
                <label>NOMBRE DEL PACIENTE</label>
                <input type="text" value={citaEditando.nombre} disabled />
              </div>
              {erroresModal.general && (
                <div style={{ display:'flex', gap:'8px', alignItems:'center',
                  padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5',
                  borderRadius:'8px', marginBottom:'12px' }}>
                  <span style={{fontSize:'16px'}}>❌</span>
                  <span style={{fontSize:'12px', color:'#dc2626', fontWeight:600}}>{erroresModal.general}</span>
                </div>
              )}
              <div className="form-group">
                <label>MÉDICO / ESPECIALISTA</label>
                <select value={citaEditando.medId}
                  style={{ borderColor: erroresModal.medId ? '#ef4444' : '', background: erroresModal.medId ? '#fff5f5' : '' }}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, medId: parseInt(e.target.value) }))}>
                  <option value="">Seleccione un médico</option>
                  {medicos.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} — {m.especialidad}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>FECHA Y HORA</label>
                <input type="datetime-local" value={citaEditando.fecha}
                  min={ahoraPlus3()} max={maxFecha()}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, fecha: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>ESTADO DE LA CITA</label>
                <select value={citaEditando.estado}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, estado: e.target.value }))}>
                  {ESTADOS.filter(e => e.valor !== 'ATENDIDO' && e.valor !== 'EN_TRIAGE').map(e => (
                    <option key={e.valor} value={e.valor}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Estado:</span>
                {getBadgeEstado(citaEditando.estado)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setCitaEditando(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={handleGuardarCita}>
                <FiEdit2 size={13} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CitasMedicas