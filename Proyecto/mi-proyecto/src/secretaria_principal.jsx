import { useState, useEffect, useCallback } from 'react'
import {
  FiUsers, FiCalendar, FiFileText, FiUser,
  FiSearch, FiEdit2, FiLogOut, FiEye
} from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import './secretaria_principal.css'

//Local
//const API = 'http://localhost:3001/api'

//API
const API = 'https://cmq-backend.onrender.com/api'


const hoy = new Date().toISOString().split('T')[0]

const validarTelefono = (tel) => String(tel || '').replace(/\D/g, '').length === 10
const validarFecha    = (fecha) => fecha && fecha <= hoy

/* ══════════════════════════════
   SISTEMA DE TOASTS
══════════════════════════════ */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrapper">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : '!'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, success: m => show(m, 'success'), error: m => show(m, 'error') }
}

/* ══════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════ */
function SecretariaPrincipal() {
  const navigate = useNavigate()
  const { toasts, success, error: showError } = useToast()

  const [currentTime, setCurrentTime]       = useState(new Date())
  const [pacienteEditando, setPacienteEditando] = useState(null)
  const [pacienteViendo, setPacienteViendo]     = useState(null)
  const [pacientes, setPacientes]           = useState([])
  const [numMedicos, setNumMedicos]         = useState(0)
  const [numHistorias, setNumHistorias]     = useState(0)
  const [busqueda, setBusqueda]             = useState('')
  const [errores, setErrores]               = useState({})
  const [erroresEdit, setErroresEdit]       = useState({})
  const [nuevoPaciente, setNuevoPaciente]   = useState({
    nombre: '', id: '', telefono: '', fechaNacimiento: '', genero: '',
    tipoSangre: '', email: '', direccion: '', ciudad: '',
    contactoEmergenciaNombre: '', contactoEmergenciaTel: ''
  })

  /* Reloj */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /* Carga inicial */
  useEffect(() => {
    cargarPacientes()
    cargarMedicos()
    cargarHistorias()
  }, [])

  /* ── API calls ── */
  const cargarPacientes = async () => {
  try {
    const res  = await fetch(`${API}/pacientes`)
    const data = await res.json()
    setPacientes(data.map(row => ({
      id: String(row[0]),
      nombre: row[1],
      telefono: String(row[2] || ''), // <--- Forzamos String aquí
      fechaNacimiento: row[3] ? row[3].split('T')[0] : '',
      genero: row[4],
      tipoSangre: row[5],
      email: row[6] || '',
      direccion: row[7] || '',
      ciudad: row[8] || '',
      contactoEmergenciaNombre: row[9] || '',
      contactoEmergenciaTel: String(row[10] || '') // <--- Forzamos String aquí
    })))
  } catch (err) { console.error('Error cargando pacientes:', err) }
}

  const cargarMedicos = async () => {
    try {
      const res  = await fetch(`${API}/medicos`)
      const data = await res.json()
      setNumMedicos(Array.isArray(data) ? data.length : 0)
    } catch { setNumMedicos(0) }
  }

  const cargarHistorias = async () => {
    try {
      const res  = await fetch(`${API}/historias`)
      const data = await res.json()
      setNumHistorias(Array.isArray(data) ? data.length : 0)
    } catch { setNumHistorias(0) }
  }

  /* ── Helpers ── */
  const formatDate = (d) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const formatTime = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-'
    const hoyD = new Date(), nac = new Date(fechaNacimiento)
    let edad = hoyD.getFullYear() - nac.getFullYear()
    const m = hoyD.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoyD.getDate() < nac.getDate())) edad--
    return `${edad} años`
  }

  const formatGenero = (g) =>
    g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g === 'O' ? 'Otro' : '-'

  const validarCampo = (name, value) => {
    if (name === 'telefono' || name === 'contactoEmergenciaTel') {
      if (value && value.replace(/\D/g, '').length !== 10) return 'El teléfono debe tener exactamente 10 dígitos'
    }
    if (name === 'fechaNacimiento' && value && value > hoy) return 'La fecha no puede ser mayor a hoy'
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoPaciente(prev => ({ ...prev, [name]: value }))
    setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }))
  }

  /* ── Registrar paciente ── */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Campos requeridos vacíos
    const camposRequeridos = ['id', 'nombre', 'fechaNacimiento', 'genero', 'tipoSangre', 'telefono']
    if (camposRequeridos.some(c => !nuevoPaciente[c]?.trim())) {
      showError('Ingrese los datos requeridos en cada campo')
      return
    }

    // Formato incorrecto
    const nuevosErrores = {}
    if (!validarTelefono(nuevoPaciente.telefono))
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos'
    if (!validarFecha(nuevoPaciente.fechaNacimiento))
      nuevosErrores.fechaNacimiento = 'La fecha no puede ser mayor a hoy'
    if (nuevoPaciente.contactoEmergenciaTel && !validarTelefono(nuevoPaciente.contactoEmergenciaTel))
      nuevosErrores.contactoEmergenciaTel = 'El teléfono debe tener exactamente 10 dígitos'

    if (Object.values(nuevosErrores).some(e => e)) {
      setErrores(nuevosErrores)
      showError('Por favor ingrese correctamente los datos')
      return
    }

    // ID duplicado
    if (pacientes.find(p => p.id === nuevoPaciente.id.trim())) {
      showError('Datos ya existentes en la base de datos')
      return
    }

    // Validar que la cédula sea solo números
if (!/^\d+$/.test(nuevoPaciente.id)) {
  showError('No se puede agregar')
  return
}

    try {
      const res  = await fetch(`${API}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoPaciente, id: nuevoPaciente.id.trim() })
      })
      const data = await res.json()
      if (data.success) {
        await cargarPacientes()
        setNuevoPaciente({
          nombre: '', id: '', telefono: '', fechaNacimiento: '', genero: '',
          tipoSangre: '', email: '', direccion: '', ciudad: '',
          contactoEmergenciaNombre: '', contactoEmergenciaTel: ''
        })
        setErrores({})
        success('Paciente registrado exitosamente')
      } else {
        showError('Por favor ingrese correctamente los datos')
      }
    } catch {
      showError('Por favor ingrese correctamente los datos')
    }
  }

  /* ── Editar paciente ── */
  const handleEditar = (p) => { setPacienteEditando({ ...p }); setErroresEdit({}) }

  const handleGuardarEdicion = async () => {
  try {
    const original = pacientes.find(p => p.id === pacienteEditando.id)

    // Detectar cambios reales
    const huboCambios = Object.keys(pacienteEditando).some(
      key => String(pacienteEditando[key] || '') !== String(original[key] || '')
    )

    if (!huboCambios) {
      showError('No se detectaron cambios')
      return
    }

    const nuevosErrores = {}
    
    if (!validarTelefono(pacienteEditando.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos'
    }

    if (Object.values(nuevosErrores).some(e => e)) {
      setErroresEdit(nuevosErrores)
      showError('Por favor ingrese correctamente los datos')
      return
    }

    const res = await fetch(`${API}/pacientes/${pacienteEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pacienteEditando)
    })
    
    const data = await res.json()

    if (data.success) {
      await cargarPacientes()
      setPacienteEditando(null)
      success('Cambios guardados exitosamente')
    } else {
      showError('No se realizaron los cambios')
    }

  } catch (err) {
    console.error(err)
    showError('Error crítico al intentar guardar')
  }
}

  const inputStyle     = (c) => ({ borderColor: errores[c]     ? '#ef4444' : '', background: errores[c]     ? '#fff5f5' : '' })
  const inputStyleEdit = (c) => ({ borderColor: erroresEdit[c] ? '#ef4444' : '', background: erroresEdit[c] ? '#fff5f5' : '' })

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.id.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',        count: pacientes.length,  icon: <FiUsers />,    path: '/secretaria' },
    { id: 'citas',     name: 'Citas Médicas',    count: 0,                 icon: <FiCalendar />, path: '/citas' },
    { id: 'historia',  name: 'Historia Clínica', count: numHistorias,      icon: <FiFileText />, path: '/historia' },
  ]

  const stats = [
    { label: 'TOTAL PACIENTES', value: pacientes.length, subtext: 'Registrados en sistema', color: 'blue',   icon: <FiUsers size={22} />,       dot: '#3b82f6' },
    { label: 'CITAS ACTIVAS',   value: 0,                subtext: 'Citas programadas',      color: 'green',  icon: <FiCalendar size={22} />,    dot: '#10b981' },
    { label: 'MÉDICOS',         value: numMedicos,        subtext: 'Especialistas activos',  color: 'orange', icon: <FaStethoscope size={22} />, dot: '#f97316' },
    { label: 'HISTORIALES',     value: numHistorias,      subtext: 'Registros clínicos',     color: 'purple', icon: <FiFileText size={22} />,    dot: '#8b5cf6' },
  ]

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="secretaria-container">

      {/* TOASTS */}
      <ToastContainer toasts={toasts} />

      {/* HEADER */}
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

      {/* LAYOUT */}
      <div className="main-content">
        <aside className="sidebar">
          <h3>MÓDULOS</h3>
          <nav className="modules-nav">
            {modules.map(mod => (
              <button key={mod.id}
                className={`module-item ${mod.id === 'pacientes' ? 'active' : ''}`}
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
            <h2>Gestión de Pacientes</h2>
            <p>Registro, consulta y actualización de pacientes del sistema</p>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon-box ${stat.color}`}>{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-subtext">
                  <span className="stat-dot" style={{ background: stat.dot }} />
                  {stat.subtext}
                </div>
              </div>
            ))}
          </div>

          {/* SECCIONES */}
          <div className="patient-sections">

            {/* FORMULARIO */}
            <div className="form-section">
              <h3><FiUser className="section-icon" /> Nuevo Paciente</h3>
              <form onSubmit={handleSubmit} className="patient-form">

                <div className="form-section-label">IDENTIFICACIÓN</div>
                <div className="form-group">
                  <label>NÚMERO DE IDENTIFICACIÓN</label>
                  <input type="text" name="id" placeholder="Ej. 1062554433"
                    value={nuevoPaciente.id} onChange={handleInputChange} required style={inputStyle('id')} />
                  {errores.id && <span className="field-error">{errores.id}</span>}
                </div>
                <div className="form-group">
                  <label>NOMBRE COMPLETO</label>
                  <input type="text" name="nombre" placeholder="Ej. Laura Grijalba Mena"
                    value={nuevoPaciente.nombre} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>FECHA DE NACIMIENTO</label>
                    <input type="date" name="fechaNacimiento" max={hoy}
                      value={nuevoPaciente.fechaNacimiento} onChange={handleInputChange} required
                      style={inputStyle('fechaNacimiento')} />
                    {errores.fechaNacimiento && <span className="field-error">{errores.fechaNacimiento}</span>}
                  </div>
                  <div className="form-group">
                    <label>GÉNERO</label>
                    <select name="genero" value={nuevoPaciente.genero} onChange={handleInputChange} required>
                      <option value="">Seleccione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>TIPO DE SANGRE</label>
                  <select name="tipoSangre" value={nuevoPaciente.tipoSangre} onChange={handleInputChange} required>
                    <option value="">Seleccione</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section-label">CONTACTO</div>
                <div className="form-group">
                  <label>TELÉFONO</label>
                  <input type="tel" name="telefono" placeholder="Ej. 3214556879"
                    value={nuevoPaciente.telefono} onChange={handleInputChange} required
                    style={inputStyle('telefono')} maxLength={10} />
                  {errores.telefono && <span className="field-error">{errores.telefono}</span>}
                </div>
                <div className="form-group">
                  <label>EMAIL</label>
                  <input type="email" name="email" placeholder="Ej. correo@email.com"
                    value={nuevoPaciente.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>DIRECCIÓN</label>
                  <input type="text" name="direccion" placeholder="Ej. Calle 12 # 3-45"
                    value={nuevoPaciente.direccion} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>CIUDAD</label>
                  <input type="text" name="ciudad" placeholder="Ej. Popayán"
                    value={nuevoPaciente.ciudad} onChange={handleInputChange} />
                </div>

                <div className="form-section-label">CONTACTO DE EMERGENCIA</div>
                <div className="form-group">
                  <label>NOMBRE COMPLETO</label>
                  <input type="text" name="contactoEmergenciaNombre" placeholder="Ej. Pedro Grijalba"
                    value={nuevoPaciente.contactoEmergenciaNombre} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>TELÉFONO</label>
                  <input type="tel" name="contactoEmergenciaTel" placeholder="Ej. 3119900112"
                    value={nuevoPaciente.contactoEmergenciaTel} onChange={handleInputChange}
                    style={inputStyle('contactoEmergenciaTel')} maxLength={10} />
                  {errores.contactoEmergenciaTel && <span className="field-error">{errores.contactoEmergenciaTel}</span>}
                </div>

                <button type="submit" className="btn-register">
                  <FiUser /> Registrar paciente
                </button>
              </form>
            </div>

            {/* DIRECTORIO */}
            <div className="directory-section">
              <h3><FiUsers className="section-icon" /> Directorio de Pacientes</h3>
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input type="text" placeholder="Búsqueda por nombre o identificación..."
                  value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className="patient-table">
                <table>
                  <thead>
                    <tr><th>IDENTIFICACION</th><th>NOMBRE COMPLETO</th><th>TELÉFONO</th><th>ACCIÓN</th></tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.nombre}</td>
                        <td>{p.telefono}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-eye" onClick={() => setPacienteViendo(p)}><FiEye size={13} /></button>
                            <button className="btn-edit" onClick={() => handleEditar(p)}><FiEdit2 size={12} /> Editar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pacientesFiltrados.length === 0 && (
                      <tr><td colSpan="4" className="no-results">No se encontraron pacientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="main-footer">
        <span>CMQ - Módulo Clínica</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {formatTime(currentTime)}
        </span>
      </footer>

      {/* MODAL VER PERFIL */}
      {pacienteViendo && (
        <div className="modal-overlay" onClick={() => setPacienteViendo(null)}>
          <div className="modal modal-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiUser size={18} /></div>
                <div><h3>Perfil del Paciente</h3><p>{pacienteViendo.nombre}</p></div>
              </div>
              <button className="modal-close" onClick={() => setPacienteViendo(null)}>✕</button>
            </div>
            <div className="modal-body perfil-body">
              <div className="perfil-seccion-titulo">IDENTIFICACIÓN</div>
              <div className="perfil-fila"><span>Número identificacion</span><span>CC {pacienteViendo.id}</span></div>
              <div className="perfil-fila"><span>Nombre Completo</span><span>{pacienteViendo.nombre}</span></div>
              <div className="perfil-fila"><span>Fecha de Nacimiento</span>
                <span>{pacienteViendo.fechaNacimiento ? new Date(pacienteViendo.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-CO') : '-'}</span>
              </div>
              <div className="perfil-fila"><span>Edad</span><span>{calcularEdad(pacienteViendo.fechaNacimiento)}</span></div>
              <div className="perfil-fila"><span>Género</span><span>{formatGenero(pacienteViendo.genero)}</span></div>
              <div className="perfil-fila"><span>Tipo de Sangre</span><span className="badge-sangre">{pacienteViendo.tipoSangre || '-'}</span></div>
              <div className="perfil-seccion-titulo">CONTACTO</div>
              <div className="perfil-fila"><span>Teléfono</span><span>{pacienteViendo.telefono}</span></div>
              <div className="perfil-fila"><span>Email</span><span>{pacienteViendo.email || '-'}</span></div>
              <div className="perfil-fila"><span>Dirección</span><span>{pacienteViendo.direccion || '-'}</span></div>
              <div className="perfil-fila"><span>Ciudad</span><span>{pacienteViendo.ciudad || '-'}</span></div>
              <div className="perfil-seccion-titulo">CONTACTO DE EMERGENCIA</div>
              <div className="perfil-fila"><span>Nombre</span><span>{pacienteViendo.contactoEmergenciaNombre || '-'}</span></div>
              <div className="perfil-fila"><span>Teléfono</span><span>{pacienteViendo.contactoEmergenciaTel || '-'}</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setPacienteViendo(null)}>Cerrar</button>
              <button className="btn-guardar" onClick={() => { setPacienteViendo(null); handleEditar(pacienteViendo) }}>
                <FiEdit2 size={13} /> Editar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {pacienteEditando && (
        <div className="modal-overlay" onClick={() => setPacienteEditando(null)}>
          <div className="modal modal-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiUser size={18} /></div>
                <div><h3>Editar Paciente</h3><p>Modifica la información del paciente</p></div>
              </div>
              <button className="modal-close" onClick={() => setPacienteEditando(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>IDENTIFICACION DEL PACIENTE</label>
                <input type="text" value={pacienteEditando.id} disabled /></div>
              <div className="form-group"><label>NOMBRE COMPLETO</label>
                <input type="text" name="nombre" value={pacienteEditando.nombre}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, nombre: e.target.value }))} /></div>
              <div className="form-group"><label>TELÉFONO</label>
                <input type="tel" name="telefono" value={pacienteEditando.telefono} maxLength={10}
                  onChange={(e) => { setPacienteEditando(prev => ({ ...prev, telefono: e.target.value })); setErroresEdit(prev => ({ ...prev, telefono: validarCampo('telefono', e.target.value) })) }}
                  style={inputStyleEdit('telefono')} />
                {erroresEdit.telefono && <span className="field-error">{erroresEdit.telefono}</span>}
              </div>
              <div className="form-group"><label>EMAIL</label>
                <input type="email" value={pacienteEditando.email}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, email: e.target.value }))} /></div>
              <div className="form-group"><label>DIRECCIÓN</label>
                <input type="text" value={pacienteEditando.direccion}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, direccion: e.target.value }))} /></div>
              <div className="form-group"><label>CIUDAD</label>
                <input type="text" value={pacienteEditando.ciudad}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, ciudad: e.target.value }))} /></div>
              <div className="form-group"><label>CONTACTO EMERGENCIA — NOMBRE</label>
                <input type="text" value={pacienteEditando.contactoEmergenciaNombre}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, contactoEmergenciaNombre: e.target.value }))} /></div>
              <div className="form-group"><label>CONTACTO EMERGENCIA — TELÉFONO</label>
                <input type="tel" value={pacienteEditando.contactoEmergenciaTel} maxLength={10}
                  onChange={(e) => { setPacienteEditando(prev => ({ ...prev, contactoEmergenciaTel: e.target.value })); setErroresEdit(prev => ({ ...prev, contactoEmergenciaTel: validarCampo('contactoEmergenciaTel', e.target.value) })) }}
                  style={inputStyleEdit('contactoEmergenciaTel')} />
                {erroresEdit.contactoEmergenciaTel && <span className="field-error">{erroresEdit.contactoEmergenciaTel}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setPacienteEditando(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={handleGuardarEdicion}><FiEdit2 size={13} /> Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SecretariaPrincipal
