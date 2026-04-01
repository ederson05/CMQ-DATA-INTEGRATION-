import { useState, useEffect } from 'react'
import {
  FiCalendar, FiUsers, FiFileText,
  FiEdit2, FiSearch, FiLogOut
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './citas_medicas.css'

const API = 'http://localhost:3001/api'
const ahora = () => new Date().toISOString().slice(0, 16)

const ESTADOS = [
  { valor: 'PROGRAMADA',  label: 'Programada',  bg: '#eff6ff', color: '#3b82f6' },
  { valor: 'CONFIRMADA',  label: 'Confirmada',  bg: '#f0fdf4', color: '#22c55e' },
  { valor: 'EN_ATENCION', label: 'En Atención', bg: '#fff7ed', color: '#f97316' },
  { valor: 'COMPLETADA',  label: 'Completada',  bg: '#f5f3ff', color: '#8b5cf6' },
  { valor: 'CANCELADA',   label: 'Cancelada',   bg: '#fef2f2', color: '#ef4444' },
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

function CitasMedicas() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [citaEditando, setCitaEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [citas, setCitas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [errores, setErrores] = useState({})
  const [nuevaCita, setNuevaCita] = useState({
    identificacion: '', medico: '', fecha: '', motivo: '', nivelPaciente: 'ESTABLE'
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
    const d = new Date(fechaStr)
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const handleInputCita = (e) => {
    const { name, value } = e.target
    setNuevaCita(prev => ({ ...prev, [name]: value }))
    let error = ''
    if (name === 'fecha' && value && value < ahora())
      error = 'La fecha no puede ser en el pasado'
    setErrores(prev => ({ ...prev, [name]: error }))
  }

  const handleConfirmarCita = async (e) => {
    e.preventDefault()
    if (!nuevaCita.identificacion.trim()) { alert('⚠️ Ingresa la identificación del paciente'); return }
    if (!nuevaCita.medico)                { alert('⚠️ Selecciona un médico'); return }
    if (!nuevaCita.fecha)                 { alert('⚠️ Selecciona la fecha y hora'); return }
    if (nuevaCita.fecha < ahora()) {
      setErrores(prev => ({ ...prev, fecha: 'La fecha no puede ser en el pasado' }))
      return
    }

    const paciente = pacientes.find(p => p.id === nuevaCita.identificacion.trim())
    if (!paciente) { alert('⚠️ No se encontró ningún paciente con esa identificación'); return }

    const medico = medicos.find(m => String(m.id) === nuevaCita.medico)

    const duplicada = citas.find(c =>
      c.pacDocumento === nuevaCita.identificacion.trim() &&
      c.medId === parseInt(nuevaCita.medico) &&
      c.fecha.split('T')[0] === nuevaCita.fecha.split('T')[0]
    )
    if (duplicada) { alert('⚠️ Este paciente ya tiene una cita con ese médico en esa fecha'); return }

    try {
      const res = await fetch(`${API}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacDocumento:  nuevaCita.identificacion.trim(),
          medId:         parseInt(nuevaCita.medico),
          fechaHora:     nuevaCita.fecha,
          motivo:        nuevaCita.motivo,
          nivelPaciente: nuevaCita.nivelPaciente
        })
      })
      const data = await res.json()
      if (data.success) {
        await cargarDatos()
        setNuevaCita({ identificacion: '', medico: '', fecha: '', motivo: '', nivelPaciente: 'ESTABLE' })
        setErrores({})
        alert(`✅ Cita generada\n\n👤 ${paciente.nombre}\n👨‍⚕️ ${medico?.nombre}\n📅 ${formatFecha(nuevaCita.fecha)}\n🏥 Nivel: ${nuevaCita.nivelPaciente}`)
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (err) {
      alert('❌ Error conectando al servidor')
    }
  }

  const handleEditarCita = (cita) => setCitaEditando({ ...cita })

  const handleGuardarCita = async () => {
    if (!citaEditando.medId) { alert('⚠️ Selecciona un médico'); return }
    if (!citaEditando.fecha) { alert('⚠️ Selecciona una fecha'); return }
    if (citaEditando.estado !== 'CANCELADA' && citaEditando.fecha < ahora()) {
      alert('⚠️ La fecha no puede ser en el pasado'); return
    }

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
        alert('✅ Cita modificada exitosamente')
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (err) {
      alert('❌ Error conectando al servidor')
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
              <form onSubmit={handleConfirmarCita} className="cita-form">

                <div className="form-group">
                  <label>IDENTIFICACIÓN DEL PACIENTE</label>
                  <input type="text" name="identificacion" placeholder="Ej. 1088156632"
                    value={nuevaCita.identificacion} onChange={handleInputCita} />
                </div>

                <div className="form-group">
                  <label>MÉDICO / ESPECIALISTA</label>
                  <select name="medico" value={nuevaCita.medico} onChange={handleInputCita}>
                    <option value="">Seleccione un médico</option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} — {m.especialidad}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>FECHA Y HORA</label>
                  <input type="datetime-local" name="fecha"
                    min={ahora()} max="2099-12-31T23:59"
                    value={nuevaCita.fecha} onChange={handleInputCita}
                    style={{ borderColor: errores.fecha ? '#ef4444' : '', background: errores.fecha ? '#fff5f5' : '' }} />
                  {errores.fecha && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errores.fecha}</span>}
                </div>

                <div className="form-group">
                  <label>MOTIVO DE CONSULTA</label>
                  <input type="text" name="motivo"
                    placeholder="Ej. Dolor de cabeza, control rutinario..."
                    value={nuevaCita.motivo} onChange={handleInputCita} />
                </div>

                <div className="form-group">
                  <label>NIVEL DEL PACIENTE</label>
                  <select name="nivelPaciente" value={nuevaCita.nivelPaciente} onChange={handleInputCita}>
                    {NIVELES.map(n => (
                      <option key={n.valor} value={n.valor}>{n.label}</option>
                    ))}
                  </select>
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
                      <th>FECHA</th><th>ESTADO</th><th>NIVEL</th><th>ACCIÓN</th>
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
                        <td>{getBadgeNivel(c.nivelPaciente)}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditarCita(c)}>
                            <FiEdit2 size={12} /> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {citasFiltradas.length === 0 && (
                      <tr><td colSpan="7" className="no-results">No se encontraron citas</td></tr>
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
              <div className="form-group">
                <label>MÉDICO / ESPECIALISTA</label>
                <select value={citaEditando.medId}
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
                  min={ahora()} max="2099-12-31T23:59"
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, fecha: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>ESTADO DE LA CITA</label>
                <select value={citaEditando.estado}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, estado: e.target.value }))}>
                  {ESTADOS.map(e => (
                    <option key={e.valor} value={e.valor}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>NIVEL DEL PACIENTE</label>
                <select value={citaEditando.nivelPaciente}
                  onChange={(e) => setCitaEditando(prev => ({ ...prev, nivelPaciente: e.target.value }))}>
                  {NIVELES.map(n => (
                    <option key={n.valor} value={n.valor}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Estado:</span>
                  {getBadgeEstado(citaEditando.estado)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Nivel:</span>
                  {getBadgeNivel(citaEditando.nivelPaciente)}
                </div>
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