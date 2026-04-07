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
   CAMPO CON VALIDACIÓN REQUERIDA
   Muestra el mensajito rojo debajo del input
══════════════════════════════ */
function CampoRequerido({ error, children }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {error && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
          fontSize: '12px',
          color: '#dc2626',
          fontWeight: 500
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            background: '#f97316',
            borderRadius: '3px',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            flexShrink: 0
          }}>!</span>
          {error}
        </span>
      )}
    </div>
  )
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
  const [intentoEnvio, setIntentoEnvio]     = useState(false)
  const [intentoEdit, setIntentoEdit]       = useState(false)
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
      telefono: String(row[2] || ''),
      fechaNacimiento: row[3] ? row[3].split('T')[0] : '',
      genero: row[4],
      tipoSangre: row[5],
      email: row[6] || '',
      direccion: row[7] || '',
      ciudad: row[8] || '',
      contactoEmergenciaNombre: row[9] || '',
      contactoEmergenciaTel: String(row[10] || '')
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

  // Formato unificado: "20/03/2026, 22:29:09"
  const formatDateTime = (d) => d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  // Solo fecha para el header (si la necesitas separada en algún lugar)
  const formatDate = (d) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Solo hora para el header
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

  /* ── Validación de campo individual ── */
  const validarCampo = (name, value) => {
    // Campos requeridos (excepto email y contacto de emergencia)
    const camposRequeridos = ['id', 'nombre', 'fechaNacimiento', 'genero', 'tipoSangre', 'telefono', 'direccion', 'ciudad']
    if (camposRequeridos.includes(name) && (!value || !value.trim())) {
      return 'Este campo es requerido'
    }
    if (name === 'telefono' || name === 'contactoEmergenciaTel') {
      if (value && value.replace(/\D/g, '').length !== 10) return 'El teléfono debe tener exactamente 10 dígitos'
    }
    if (name === 'fechaNacimiento' && value && value > hoy) return 'La fecha no puede ser mayor a hoy'
    return ''
  }

  /* ── Validación edición ── */
  const validarCampoEdit = (name, value) => {
    const camposRequeridosEdit = ['nombre', 'telefono', 'direccion', 'ciudad']
    if (camposRequeridosEdit.includes(name) && (!value || !value.trim())) {
      return 'Este campo es requerido'
    }
    if (name === 'telefono' || name === 'contactoEmergenciaTel') {
      if (value && value.replace(/\D/g, '').length !== 10) return 'El teléfono debe tener exactamente 10 dígitos'
    }
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoPaciente(prev => ({ ...prev, [name]: value }))
    if (intentoEnvio) {
      setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }))
    } else {
      // Solo valida formato (teléfono/fecha) en tiempo real, no requerido
      const camposFormato = ['telefono', 'contactoEmergenciaTel', 'fechaNacimiento']
      if (camposFormato.includes(name)) {
        setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }))
      }
    }
  }

  /* ── Calcular todos los errores del formulario ── */
  const calcularErroresFormulario = (paciente) => {
    const camposAValidar = ['id', 'nombre', 'fechaNacimiento', 'genero', 'tipoSangre', 'telefono', 'direccion', 'ciudad', 'contactoEmergenciaTel']
    const nuevosErrores = {}
    camposAValidar.forEach(campo => {
      const err = validarCampo(campo, paciente[campo])
      if (err) nuevosErrores[campo] = err
    })
    return nuevosErrores
  }

  /* ── Registrar paciente ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIntentoEnvio(true)

    const nuevosErrores = calcularErroresFormulario(nuevoPaciente)
    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      showError('Ingrese los datos requeridos en cada campo')
      return
    }

    // Validar que la cédula sea solo números
    if (!/^\d+$/.test(nuevoPaciente.id)) {
      showError('No se puede agregar')
      return
    }

    // ID duplicado
    if (pacientes.find(p => p.id === nuevoPaciente.id.trim())) {
      showError('Datos ya existentes en la base de datos')
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
        setIntentoEnvio(false)
        success('Paciente registrado exitosamente')
      } else {
        showError('Por favor ingrese correctamente los datos')
      }
    } catch {
      showError('Por favor ingrese correctamente los datos')
    }
  }

  /* ── Editar paciente ── */
  const handleEditar = (p) => {
    setPacienteEditando({ ...p })
    setErroresEdit({})
    setIntentoEdit(false)
  }

  const handleCambioEdit = (field, value) => {
    setPacienteEditando(prev => ({ ...prev, [field]: value }))
    if (intentoEdit) {
      setErroresEdit(prev => ({ ...prev, [field]: validarCampoEdit(field, value) }))
    } else {
      const camposFormato = ['telefono', 'contactoEmergenciaTel']
      if (camposFormato.includes(field)) {
        setErroresEdit(prev => ({ ...prev, [field]: validarCampoEdit(field, value) }))
      }
    }
  }

  const handleGuardarEdicion = async () => {
    setIntentoEdit(true)

    const camposAValidarEdit = ['nombre', 'telefono', 'direccion', 'ciudad', 'contactoEmergenciaTel']
    const nuevosErrores = {}
    camposAValidarEdit.forEach(campo => {
      const err = validarCampoEdit(campo, pacienteEditando[campo])
      if (err) nuevosErrores[campo] = err
    })
    setErroresEdit(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      showError('Por favor ingrese correctamente los datos')
      return
    }

    try {
      const original = pacientes.find(p => p.id === pacienteEditando.id)

      const huboCambios = Object.keys(pacienteEditando).some(
        key => String(pacienteEditando[key] || '') !== String(original[key] || '')
      )

      if (!huboCambios) {
        showError('No se detectaron cambios')
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
        setIntentoEdit(false)
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
            {/* Fecha y hora unificadas con coma: "20/03/2026, 22:29:09" */}
            <span className="current-date">{formatDateTime(currentTime)}</span>
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

            {/* FORMULARIO — sin noValidate para activar tooltips nativos del browser */}
            <div className="form-section">
              <h3><FiUser className="section-icon" /> Nuevo Paciente</h3>
              <form onSubmit={handleSubmit} className="patient-form">

                <div className="form-section-label">IDENTIFICACIÓN</div>

                <div className="form-group">
                  <label>NÚMERO DE IDENTIFICACIÓN *</label>
                  <CampoRequerido error={errores.id}>
                    <input
                      type="text"
                      name="id"
                      placeholder="Ej. 1062554433"
                      value={nuevoPaciente.id}
                      onChange={handleInputChange}
                      style={inputStyle('id')}
                      required
                    />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>NOMBRE COMPLETO *</label>
                  <CampoRequerido error={errores.nombre}>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ej. Laura Grijalba Mena"
                      value={nuevoPaciente.nombre}
                      onChange={handleInputChange}
                      style={inputStyle('nombre')}
                      required
                    />
                  </CampoRequerido>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>FECHA DE NACIMIENTO *</label>
                    <CampoRequerido error={errores.fechaNacimiento}>
                      <input
                        type="date"
                        name="fechaNacimiento"
                        max={hoy}
                        value={nuevoPaciente.fechaNacimiento}
                        onChange={handleInputChange}
                        style={inputStyle('fechaNacimiento')}
                        required
                      />
                    </CampoRequerido>
                  </div>
                  <div className="form-group">
                    <label>GÉNERO *</label>
                    <CampoRequerido error={errores.genero}>
                      <select
                        name="genero"
                        value={nuevoPaciente.genero}
                        onChange={handleInputChange}
                        style={inputStyle('genero')}
                        required
                      >
                        <option value="">Seleccione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    </CampoRequerido>
                  </div>
                </div>

                <div className="form-group">
                  <label>TIPO DE SANGRE *</label>
                  <CampoRequerido error={errores.tipoSangre}>
                    <select
                      name="tipoSangre"
                      value={nuevoPaciente.tipoSangre}
                      onChange={handleInputChange}
                      style={inputStyle('tipoSangre')}
                      required
                    >
                      <option value="">Seleccione</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </CampoRequerido>
                </div>

                <div className="form-section-label">CONTACTO</div>

                <div className="form-group">
                  <label>TELÉFONO *</label>
                  <CampoRequerido error={errores.telefono}>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Ej. 3214556879"
                      value={nuevoPaciente.telefono}
                      onChange={handleInputChange}
                      style={inputStyle('telefono')}
                      maxLength={10}
                      required
                    />
                  </CampoRequerido>
                </div>

                {/* EMAIL — opcional, sin required */}
                <div className="form-group">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Ej. correo@email.com"
                    value={nuevoPaciente.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>DIRECCIÓN *</label>
                  <CampoRequerido error={errores.direccion}>
                    <input
                      type="text"
                      name="direccion"
                      placeholder="Ej. Calle 12 # 3-45"
                      value={nuevoPaciente.direccion}
                      onChange={handleInputChange}
                      style={inputStyle('direccion')}
                      required
                    />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>CIUDAD *</label>
                  <CampoRequerido error={errores.ciudad}>
                    <input
                      type="text"
                      name="ciudad"
                      placeholder="Ej. Popayán"
                      value={nuevoPaciente.ciudad}
                      onChange={handleInputChange}
                      style={inputStyle('ciudad')}
                      required
                    />
                  </CampoRequerido>
                </div>

                {/* CONTACTO DE EMERGENCIA — sin tocar, sin required */}
                <div className="form-section-label">CONTACTO DE EMERGENCIA</div>

                <div className="form-group">
                  <label>NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    name="contactoEmergenciaNombre"
                    placeholder="Ej. Pedro Grijalba"
                    value={nuevoPaciente.contactoEmergenciaNombre}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>TELÉFONO</label>
                  <CampoRequerido error={errores.contactoEmergenciaTel}>
                    <input
                      type="tel"
                      name="contactoEmergenciaTel"
                      placeholder="Ej. 3119900112"
                      value={nuevoPaciente.contactoEmergenciaTel}
                      onChange={handleInputChange}
                      style={inputStyle('contactoEmergenciaTel')}
                      maxLength={10}
                    />
                  </CampoRequerido>
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
          {/* Formato unificado con coma en el footer también */}
          Sesión activa — {formatDateTime(currentTime)}
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

              <div className="form-group">
                <label>IDENTIFICACION DEL PACIENTE</label>
                <input type="text" value={pacienteEditando.id} disabled />
              </div>

              {/* NOMBRE — requerido en edición */}
              <div className="form-group">
                <label>NOMBRE COMPLETO *</label>
                <CampoRequerido error={erroresEdit.nombre}>
                  <input
                    type="text"
                    name="nombre"
                    value={pacienteEditando.nombre}
                    onChange={(e) => handleCambioEdit('nombre', e.target.value)}
                    style={inputStyleEdit('nombre')}
                    required
                  />
                </CampoRequerido>
              </div>

              {/* TELÉFONO — requerido en edición */}
              <div className="form-group">
                <label>TELÉFONO *</label>
                <CampoRequerido error={erroresEdit.telefono}>
                  <input
                    type="tel"
                    name="telefono"
                    value={pacienteEditando.telefono}
                    maxLength={10}
                    onChange={(e) => handleCambioEdit('telefono', e.target.value)}
                    style={inputStyleEdit('telefono')}
                    required
                  />
                </CampoRequerido>
              </div>

              {/* EMAIL — opcional en edición, sin required */}
              <div className="form-group">
                <label>EMAIL</label>
                <input
                  type="email"
                  value={pacienteEditando.email}
                  onChange={(e) => handleCambioEdit('email', e.target.value)}
                />
              </div>

              {/* DIRECCIÓN — requerido en edición */}
              <div className="form-group">
                <label>DIRECCIÓN *</label>
                <CampoRequerido error={erroresEdit.direccion}>
                  <input
                    type="text"
                    value={pacienteEditando.direccion}
                    onChange={(e) => handleCambioEdit('direccion', e.target.value)}
                    style={inputStyleEdit('direccion')}
                    required
                  />
                </CampoRequerido>
              </div>

              {/* CIUDAD — requerido en edición */}
              <div className="form-group">
                <label>CIUDAD *</label>
                <CampoRequerido error={erroresEdit.ciudad}>
                  <input
                    type="text"
                    value={pacienteEditando.ciudad}
                    onChange={(e) => handleCambioEdit('ciudad', e.target.value)}
                    style={inputStyleEdit('ciudad')}
                    required
                  />
                </CampoRequerido>
              </div>

              {/* CONTACTO DE EMERGENCIA — sin tocar, sin required */}
              <div className="form-group">
                <label>CONTACTO EMERGENCIA — NOMBRE</label>
                <input
                  type="text"
                  value={pacienteEditando.contactoEmergenciaNombre}
                  onChange={(e) => handleCambioEdit('contactoEmergenciaNombre', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>CONTACTO EMERGENCIA — TELÉFONO</label>
                <CampoRequerido error={erroresEdit.contactoEmergenciaTel}>
                  <input
                    type="tel"
                    value={pacienteEditando.contactoEmergenciaTel}
                    maxLength={10}
                    onChange={(e) => handleCambioEdit('contactoEmergenciaTel', e.target.value)}
                    style={inputStyleEdit('contactoEmergenciaTel')}
                  />
                </CampoRequerido>
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