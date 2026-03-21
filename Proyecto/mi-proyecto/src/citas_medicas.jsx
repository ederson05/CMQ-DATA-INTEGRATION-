import { useState, useEffect } from 'react'
import {
  FiCalendar, FiUsers, FiFileText,
  FiEdit2, FiSearch, FiLogOut
} from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import './citas_medicas.css'

const medicos = [
  'Juan Meneses',
  'Juan Espada',
  'Sandra Erazo',
  'Hernesto',
  'Natalia Arcos',
]

// Pacientes registrados (simulando base de datos compartida)
const pacientesDB = [
  { id: '10821', nombre: 'Ederson' },
  { id: '87026', nombre: 'Manuel' },
  { id: '59741', nombre: 'Meneses' },
  { id: '10887', nombre: 'Cristian' },
  { id: '9965',  nombre: 'Jhonatan Erazo' },
]

function CitasMedicas() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [citaEditando, setCitaEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const [citas, setCitas] = useState([
    { id: '10821', nombre: 'Ederson',       medico: 'Juan Meneses',  fecha: '2026-03-25T09:00' },
    { id: '87026', nombre: 'Manuel',         medico: 'Juan Espada',   fecha: '2026-03-26T10:30' },
    { id: '59741', nombre: 'Meneses',        medico: 'Sandra Erazo',  fecha: '2026-03-27T08:00' },
    { id: '10887', nombre: 'Cristian',       medico: 'Hernesto',      fecha: '2026-03-28T14:00' },
    { id: '9965',  nombre: 'Jhonatan Erazo', medico: 'Natalia Arcos', fecha: '2026-03-29T11:00' },
  ])

  const [nuevaCita, setNuevaCita] = useState({
    identificacion: '', medico: '', fecha: '', motivo: ''
  })

  // ⏰ Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => date.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const formatTime = (date) => date.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  })
  const formatFecha = (fechaStr) => {
    const d = new Date(fechaStr)
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  // ── PROGRAMAR CITA ──
  const handleInputCita = (e) => {
    const { name, value } = e.target
    setNuevaCita(prev => ({ ...prev, [name]: value }))
  }

  const handleConfirmarCita = (e) => {
    e.preventDefault()

    if (!nuevaCita.identificacion.trim()) {
      alert('⚠️ Por favor ingresa la identificación del paciente')
      return
    }
    if (!nuevaCita.medico) {
      alert('⚠️ Por favor selecciona un médico / especialista')
      return
    }
    if (!nuevaCita.fecha) {
      alert('⚠️ Por favor selecciona la fecha y hora de la cita')
      return
    }
    if (new Date(nuevaCita.fecha) < new Date()) {
      alert('⚠️ La fecha y hora de la cita no puede ser en el pasado')
      return
    }

    const paciente = pacientesDB.find(p => p.id === nuevaCita.identificacion.trim())
    if (!paciente) {
      alert('⚠️ No se encontró ningún paciente con esa identificación.\nVerifica el ID e intenta de nuevo.')
      return
    }

    const fechaCita = new Date(nuevaCita.fecha).toDateString()
    const duplicada = citas.find(c =>
      c.id === nuevaCita.identificacion.trim() &&
      c.medico === nuevaCita.medico &&
      new Date(c.fecha).toDateString() === fechaCita
    )
    if (duplicada) {
      alert('⚠️ Este paciente ya tiene una cita con ese médico en esa fecha')
      return
    }

    const nueva = {
      id: paciente.id,
      nombre: paciente.nombre,
      medico: nuevaCita.medico,
      fecha: nuevaCita.fecha,
      motivo: nuevaCita.motivo
    }
    setCitas(prev => [...prev, nueva])
    setNuevaCita({ identificacion: '', medico: '', fecha: '', motivo: '' })
    alert(
      `✅ Cita generada con éxito\n\n` +
      `👤 Paciente: ${paciente.nombre}\n` +
      `👨‍⚕️ Médico: ${nueva.medico}\n` +
      `📅 Fecha: ${formatFecha(nueva.fecha)}`
    )
  }

  // ── EDITAR CITA ──
  const handleEditarCita = (cita, index) => {
    setCitaEditando({
      ...cita,
      _index: index,
      _medicoOriginal: cita.medico,
      _fechaOriginal: cita.fecha
    })
  }

  const handleGuardarCita = () => {
    if (!citaEditando.medico) {
      alert('⚠️ Debes seleccionar un médico')
      return
    }
    if (!citaEditando.fecha) {
      alert('⚠️ Debes seleccionar una fecha y hora')
      return
    }
    if (new Date(citaEditando.fecha) < new Date()) {
      alert('⚠️ La fecha y hora no puede ser en el pasado')
      return
    }
    if (
      citaEditando.medico === citaEditando._medicoOriginal &&
      citaEditando.fecha === citaEditando._fechaOriginal
    ) {
      alert('⚠️ No se modificaron datos')
      return
    }

    setCitas(prev => prev.map((c, i) =>
      i === citaEditando._index
        ? { ...c, medico: citaEditando.medico, fecha: citaEditando.fecha }
        : c
    ))
    setCitaEditando(null)
    alert('✅ Cita modificada exitosamente')
  }

  const citasFiltradas = citas.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',        count: pacientesDB.length, icon: <FiUsers />,    path: '/secretaria' },
    { id: 'citas',     name: 'Citas Médicas',    count: citas.length,       icon: <FiCalendar />, path: '/citas' },
    { id: 'historia',  name: 'Historia Clínica', count: 2,                  icon: <FiFileText />, path: '/historia' },
  ]

  return (
    <div className="citas-container">

      {/* ── HEADER ── */}
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

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <h3>MÓDULOS</h3>
          <nav className="modules-nav">
            {modules.map(mod => (
              <button
                key={mod.id}
                className={`module-item ${mod.id === 'citas' ? 'active' : ''}`}
                onClick={() => navigate(mod.path)}
              >
                <span className="module-icon">{mod.icon}</span>
                <span className="module-name">{mod.name}</span>
                <span className="module-count">{mod.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CONTENIDO ── */}
        <main className="content-area">
          <div className="page-header">
            <h2>Citas Médicas</h2>
            <p>Programación y consulta de citas con especialistas</p>
          </div>

          <div className="citas-sections">

            {/* Programar Cita */}
            <div className="form-section">
              <h3><FiCalendar className="section-icon" /> Programar Cita</h3>
              <form onSubmit={handleConfirmarCita} className="cita-form">
                <div className="form-group">
                  <label>IDENTIFICACIÓN DEL PACIENTE</label>
                  <input
                    type="text" name="identificacion"
                    placeholder="Ej. 10821"
                    value={nuevaCita.identificacion}
                    onChange={handleInputCita}
                  />
                </div>
                <div className="form-group">
                  <label>MÉDICO / ESPECIALISTA</label>
                  <select name="medico" value={nuevaCita.medico} onChange={handleInputCita}>
                    <option value="">Seleccione un médico</option>
                    {medicos.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>FECHA Y HORA</label>
                  <input
                    type="datetime-local" name="fecha"
                    value={nuevaCita.fecha}
                    onChange={handleInputCita}
                  />
                </div>
                <div className="form-group">
                  <label>MOTIVO DE CONSULTA</label>
                  <input
                    type="text" name="motivo"
                    placeholder="Ej. Dolor de cabeza, control rutinario..."
                    value={nuevaCita.motivo}
                    onChange={handleInputCita}
                  />
                </div>
                <button type="submit" className="btn-confirmar">
                  <FiCalendar /> Confirmar Cita
                </button>
              </form>
            </div>

            {/* Registro de Citas */}
            <div className="directory-section">
              <div className="directory-header">
                <h3><FiCalendar className="section-icon" /> Registro de Citas</h3>
                <div className="search-inline">
                  <input
                    type="text"
                    placeholder="Búsqueda por identificación..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <button className="btn-buscar"><FiSearch /> Buscar</button>
                </div>
              </div>

              <div className="citas-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>NOMBRE DEL PACIENTE</th>
                      <th>MÉDICO/ESPECIALISTA</th>
                      <th>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((c, index) => (
                      <tr key={index}>
                        <td>{c.id}...</td>
                        <td>{c.nombre}</td>
                        <td>{c.medico}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditarCita(c, index)}>
                            <FiEdit2 size={12} /> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {citasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-results">No se encontraron citas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="main-footer">
        <span>CMQ - Módulo Clínica</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {formatTime(currentTime)}
        </span>
      </footer>

      {/* ── MODAL EDITAR CITA ── */}
      {citaEditando && (
        <div className="modal-overlay" onClick={() => setCitaEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box">
                  <FiCalendar size={18} />
                </div>
                <div>
                  <h3>Editar cita médica</h3>
                  <p>Modifica la información de la cita</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setCitaEditando(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>ID DEL PACIENTE</label>
                <input type="text" value={citaEditando.id} disabled />
              </div>
              <div className="form-group">
                <label>NOMBRE DEL PACIENTE</label>
                <input type="text" value={citaEditando.nombre} disabled />
              </div>
              <div className="form-group">
                <label>MÉDICO / ESPECIALISTA</label>
                <select
                  value={citaEditando.medico}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, medico: e.target.value }))}
                >
                  <option value="">Seleccione un médico</option>
                  {medicos.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>FECHA Y HORA</label>
                <input
                  type="datetime-local"
                  value={citaEditando.fecha}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setCitaEditando(null)}>
                Cancelar
              </button>
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