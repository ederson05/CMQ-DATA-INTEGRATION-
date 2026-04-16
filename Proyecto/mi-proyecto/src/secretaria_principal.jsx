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

/* REGLAS DE VALIDACIÓN*/
const REGLAS = {
  // Solo letras (incluyendo acentos y ñ) y espacios
  soloLetras: (valor) => /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(valor.trim()),

  // Email: letras, números, y solo estos caracteres especiales: @ . _ - +
  // Sin tildes, sin ñ, sin caracteres raros
  emailValido: (valor) => /^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(valor),

  // Solo dígitos
  soloNumeros: (valor) => /^\d+$/.test(valor),

  // Teléfono: exactamente 10 dígitos
  telefono: (valor) => String(valor || '').replace(/\D/g, '').length === 10,

  // Fecha no futura
  fechaValida: (valor) => valor && valor <= hoy,
}

/* Valida un campo del formulario de REGISTRO y retorna string de error o '' */
const validarCampoRegistro = (name, value) => {
  const v = String(value || '').trim()

  switch (name) {
    case 'id':
      if (!v) return 'El número de identificación es requerido'
      if (!REGLAS.soloNumeros(v)) return 'El número de identificación solo debe contener dígitos'
      if (v.length < 5 || v.length > 15) return 'El número de identificación debe tener entre 5 y 15 dígitos'
      return ''

    case 'nombre':
      if (!v) return 'El nombre completo es requerido'
      if (!REGLAS.soloLetras(v)) return 'El nombre solo debe contener letras y espacios'
      if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres'
      return ''

    case 'fechaNacimiento':
      if (!v) return 'La fecha de nacimiento es requerida'
      if (!REGLAS.fechaValida(v)) return 'La fecha de nacimiento no puede ser una fecha futura'
      return ''

    case 'genero':
      if (!v) return 'El género es requerido'
      return ''

    case 'tipoSangre':
      if (!v) return 'El tipo de sangre es requerido'
      return ''

    case 'telefono':
      if (!v) return 'El teléfono es requerido'
      if (!REGLAS.telefono(v)) return 'El teléfono debe contener exactamente 10 dígitos numéricos'
      return ''

    case 'email':
      // Opcional — solo valida formato si se llenó
      if (v && !REGLAS.emailValido(v)) return 'El email no es válido. Use solo letras sin tildes, números, punto, guion o guion bajo'
      return ''

    case 'direccion':
      if (!v) return 'La dirección es requerida'
      return ''

    case 'ciudad':
      if (!v) return 'La ciudad es requerida'
      if (!REGLAS.soloLetras(v)) return 'La ciudad solo debe contener letras y espacios'
      return ''

    case 'contactoEmergenciaNombre':
      // Opcional — solo valida formato si se llenó
      if (v && !REGLAS.soloLetras(v)) return 'El nombre de contacto solo debe contener letras y espacios'
      return ''

    case 'contactoEmergenciaTel':
      // Opcional — solo valida formato si se llenó
      if (v && !REGLAS.telefono(v)) return 'El teléfono de emergencia debe contener exactamente 10 dígitos numéricos'
      return ''

    default:
      return ''
  }
}

/* Valida un campo del formulario de EDICIÓN y retorna string de error o '' */
const validarCampoEdicion = (name, value) => {
  const v = String(value || '').trim()

  switch (name) {
    case 'nombre':
      if (!v) return 'El nombre completo es requerido'
      if (!REGLAS.soloLetras(v)) return 'El nombre solo debe contener letras y espacios, sin números ni caracteres especiales'
      if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres'
      return ''

    case 'telefono':
      if (!v) return 'El teléfono es requerido'
      if (!REGLAS.telefono(v)) return 'El teléfono debe contener exactamente 10 dígitos numéricos'
      return ''

    case 'email':
      if (v && !REGLAS.emailValido(v)) return 'El email no es válido. Use solo letras sin tildes, números, punto, guion o guion bajo'
      return ''

    case 'direccion':
      if (!v) return 'La dirección es requerida'
      return ''

    case 'ciudad':
      if (!v) return 'La ciudad es requerida'
      if (!REGLAS.soloLetras(v)) return 'La ciudad solo debe contener letras y espacios'
      return ''

    case 'contactoEmergenciaNombre':
      if (v && !REGLAS.soloLetras(v)) return 'El nombre de contacto solo debe contener letras y espacios'
      return ''

    case 'contactoEmergenciaTel':
      if (v && !REGLAS.telefono(v)) return 'El teléfono de emergencia debe contener exactamente 10 dígitos numéricos'
      return ''

    default:
      return ''
  }
}

/* Recorre todos los campos del registro y devuelve objeto con todos los errores */
const validarFormularioCompleto = (paciente) => {
  const campos = [
    'id', 'nombre', 'fechaNacimiento', 'genero', 'tipoSangre',
    'telefono', 'email', 'direccion', 'ciudad',
    'contactoEmergenciaNombre', 'contactoEmergenciaTel'
  ]
  const errores = {}
  campos.forEach(campo => {
    const err = validarCampoRegistro(campo, paciente[campo])
    if (err) errores[campo] = err
  })
  return errores
}

/* Recorre todos los campos de edición y devuelve objeto con todos los errores */
const validarEdicionCompleta = (paciente) => {
  const campos = [
    'nombre', 'telefono', 'email', 'direccion', 'ciudad',
    'contactoEmergenciaNombre', 'contactoEmergenciaTel'
  ]
  const errores = {}
  campos.forEach(campo => {
    const err = validarCampoEdicion(campo, paciente[campo])
    if (err) errores[campo] = err
  })
  return errores
}

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
  const show = useCallback((msg, type = 'success', delay = 0) => {
    setTimeout(() => {
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, delay)
  }, [])
  return {
    toasts,
    success: m => show(m, 'success'),
    error:   m => show(m, 'error'),
    // Muestra múltiples errores con retardo escalonado para que no se sobrepongan
    errors:  (lista) => lista.forEach((m, i) => show(m, 'error', i * 180))
  }
}

/* ══════════════════════════════
   CAMPO CON VALIDACIÓN
══════════════════════════════ */
function CampoRequerido({ error, children }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {error && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginTop: '4px', fontSize: '12px', color: '#dc2626', fontWeight: 500
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '14px', height: '14px', background: '#f97316',
            borderRadius: '3px', color: 'white', fontSize: '10px', fontWeight: 700, flexShrink: 0
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
  const { toasts, success, error: showError, errors: showErrors } = useToast()

  const [currentTime, setCurrentTime]           = useState(new Date())
  const [pacienteEditando, setPacienteEditando] = useState(null)
  const [pacienteViendo, setPacienteViendo]     = useState(null)
  const [pacientes, setPacientes]               = useState([])
  const [numMedicos, setNumMedicos]             = useState(0)
  const [numHistorias, setNumHistorias]         = useState(0)
  const [busqueda, setBusqueda]                 = useState('')
  const [errores, setErrores]                   = useState({})
  const [erroresEdit, setErroresEdit]           = useState({})
  const [intentoEnvio, setIntentoEnvio]         = useState(false)
  const [intentoEdit, setIntentoEdit]           = useState(false)
  const [nuevoPaciente, setNuevoPaciente]       = useState({
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

  /* ── Helpers de formato ── */
  const formatDateTime = (d) => d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
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

  /* ── Cambio de input en REGISTRO ── */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoPaciente(prev => ({ ...prev, [name]: value }))
    // Valida en tiempo real solo si ya se intentó enviar, o si es campo de formato
    if (intentoEnvio) {
      setErrores(prev => ({ ...prev, [name]: validarCampoRegistro(name, value) }))
    } else {
      const camposInmediatos = ['telefono', 'contactoEmergenciaTel', 'fechaNacimiento', 'email',
                                'nombre', 'ciudad', 'contactoEmergenciaNombre']
      if (camposInmediatos.includes(name)) {
        // Solo muestra error de formato si el campo tiene contenido
        if (value.trim()) {
          setErrores(prev => ({ ...prev, [name]: validarCampoRegistro(name, value) }))
        } else {
          setErrores(prev => ({ ...prev, [name]: '' }))
        }
      }
    }
  }

  /* ── Cambio de input en EDICIÓN ── */
  const handleCambioEdit = (field, value) => {
    setPacienteEditando(prev => ({ ...prev, [field]: value }))
    if (intentoEdit) {
      setErroresEdit(prev => ({ ...prev, [field]: validarCampoEdicion(field, value) }))
    } else {
      const camposInmediatos = ['telefono', 'contactoEmergenciaTel', 'email',
                                'nombre', 'ciudad', 'contactoEmergenciaNombre']
      if (camposInmediatos.includes(field) && value.trim()) {
        setErroresEdit(prev => ({ ...prev, [field]: validarCampoEdicion(field, value) }))
      } else if (camposInmediatos.includes(field)) {
        setErroresEdit(prev => ({ ...prev, [field]: '' }))
      }
    }
  }

  /* ── Registrar paciente ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIntentoEnvio(true)

    const nuevosErrores = validarFormularioCompleto(nuevoPaciente)
    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      // Muestra un toast específico por cada error encontrado
      const mensajes = Object.values(nuevosErrores)
      showErrors(mensajes)
      return
    }

    // ID duplicado — verificado después de pasar las validaciones de formato
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
      showError('Error al conectar con el servidor')
    }
  }

  /* ── Editar paciente ── */
  const handleEditar = (p) => {
    setPacienteEditando({ ...p })
    setErroresEdit({})
    setIntentoEdit(false)
  }

  const handleGuardarEdicion = async () => {
    setIntentoEdit(true)

    const nuevosErrores = validarEdicionCompleta(pacienteEditando)
    setErroresEdit(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      const mensajes = Object.values(nuevosErrores)
      showErrors(mensajes)
      return
    }

    // Verificar que hubo cambios reales
    const original = pacientes.find(p => p.id === pacienteEditando.id)
    const huboCambios = Object.keys(pacienteEditando).some(
      key => String(pacienteEditando[key] || '') !== String(original[key] || '')
    )
    if (!huboCambios) {
      showError('No se detectaron cambios en la información del paciente')
      return
    }

    try {
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
      showError('Error al conectar con el servidor')
    }
  }

  const inputStyle     = (c) => ({ borderColor: errores[c]     ? '#ef4444' : '', background: errores[c]     ? '#fff5f5' : '' })
  const inputStyleEdit = (c) => ({ borderColor: erroresEdit[c] ? '#ef4444' : '', background: erroresEdit[c] ? '#fff5f5' : '' })

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.id.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',        count: pacientes.length, icon: <FiUsers />,    path: '/secretaria' },
    { id: 'citas',     name: 'Citas Médicas',    count: 0,                icon: <FiCalendar />, path: '/citas' },
    { id: 'historia',  name: 'Historia Clínica', count: numHistorias,     icon: <FiFileText />, path: '/historia' },
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

            {/* ── FORMULARIO REGISTRO ── */}
            <div className="form-section">
              <h3><FiUser className="section-icon" /> Nuevo Paciente</h3>
              <form onSubmit={handleSubmit} className="patient-form">

                <div className="form-section-label">IDENTIFICACIÓN</div>

                <div className="form-group">
                  <label>NÚMERO DE IDENTIFICACIÓN *</label>
                  <CampoRequerido error={errores.id}>
                    <input type="text" name="id" placeholder="Ej. 1062554433"
                      value={nuevoPaciente.id} onChange={handleInputChange}
                      style={inputStyle('id')} required />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>NOMBRE COMPLETO *</label>
                  <CampoRequerido error={errores.nombre}>
                    <input type="text" name="nombre" placeholder="Ej. Laura Grijalba Mena"
                      value={nuevoPaciente.nombre} onChange={handleInputChange}
                      style={inputStyle('nombre')} required />
                  </CampoRequerido>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>FECHA DE NACIMIENTO *</label>
                    <CampoRequerido error={errores.fechaNacimiento}>
                      <input type="date" name="fechaNacimiento" max={hoy}
                        value={nuevoPaciente.fechaNacimiento} onChange={handleInputChange}
                        style={inputStyle('fechaNacimiento')} required />
                    </CampoRequerido>
                  </div>
                  <div className="form-group">
                    <label>GÉNERO *</label>
                    <CampoRequerido error={errores.genero}>
                      <select name="genero" value={nuevoPaciente.genero}
                        onChange={handleInputChange} style={inputStyle('genero')} required>
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
                    <select name="tipoSangre" value={nuevoPaciente.tipoSangre}
                      onChange={handleInputChange} style={inputStyle('tipoSangre')} required>
                      <option value="">Seleccione</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </CampoRequerido>
                </div>

                <div className="form-section-label">CONTACTO</div>

                <div className="form-group">
                  <label>TELÉFONO * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(10 dígitos)</span></label>
                  <CampoRequerido error={errores.telefono}>
                    <input type="tel" name="telefono" placeholder="Ej. 3214556879"
                      value={nuevoPaciente.telefono} onChange={handleInputChange}
                      style={inputStyle('telefono')} maxLength={10} required />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>EMAIL <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                  <CampoRequerido error={errores.email}>
                    <input type="text" name="email" placeholder="Ej. correo@email.com"
                      value={nuevoPaciente.email} onChange={handleInputChange}
                      style={inputStyle('email')} />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>DIRECCIÓN *</label>
                  <CampoRequerido error={errores.direccion}>
                    <input type="text" name="direccion" placeholder="Ej. Calle 12 # 3-45"
                      value={nuevoPaciente.direccion} onChange={handleInputChange}
                      style={inputStyle('direccion')} required />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>CIUDAD *</label>
                  <CampoRequerido error={errores.ciudad}>
                    <input type="text" name="ciudad" placeholder="Ej. Popayán"
                      value={nuevoPaciente.ciudad} onChange={handleInputChange}
                      style={inputStyle('ciudad')} required />
                  </CampoRequerido>
                </div>

                <div className="form-section-label">CONTACTO DE EMERGENCIA</div>

                <div className="form-group">
                  <label>NOMBRE COMPLETO <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                  <CampoRequerido error={errores.contactoEmergenciaNombre}>
                    <input type="text" name="contactoEmergenciaNombre" placeholder="Ej. Pedro Grijalba"
                      value={nuevoPaciente.contactoEmergenciaNombre} onChange={handleInputChange}
                      style={inputStyle('contactoEmergenciaNombre')} />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>TELÉFONO <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional, 10 dígitos)</span></label>
                  <CampoRequerido error={errores.contactoEmergenciaTel}>
                    <input type="tel" name="contactoEmergenciaTel" placeholder="Ej. 3119900112"
                      value={nuevoPaciente.contactoEmergenciaTel} onChange={handleInputChange}
                      style={inputStyle('contactoEmergenciaTel')} maxLength={10} />
                  </CampoRequerido>
                </div>

                <button type="submit" className="btn-register">
                  <FiUser /> Registrar paciente
                </button>
              </form>
            </div>

            {/* ── DIRECTORIO ── */}
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
          Sesión activa — {formatDateTime(currentTime)}
        </span>
      </footer>

      {/* ── MODAL VER PERFIL ── */}
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

      {/* ── MODAL EDITAR ── */}
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

              <div className="form-group">
                <label>NOMBRE COMPLETO *</label>
                <CampoRequerido error={erroresEdit.nombre}>
                  <input type="text" name="nombre" value={pacienteEditando.nombre}
                    onChange={(e) => handleCambioEdit('nombre', e.target.value)}
                    style={inputStyleEdit('nombre')} required />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>TELÉFONO * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(10 dígitos)</span></label>
                <CampoRequerido error={erroresEdit.telefono}>
                  <input type="tel" value={pacienteEditando.telefono} maxLength={10}
                    onChange={(e) => handleCambioEdit('telefono', e.target.value)}
                    style={inputStyleEdit('telefono')} required />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>EMAIL <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                <CampoRequerido error={erroresEdit.email}>
                  <input type="text" value={pacienteEditando.email}
                    onChange={(e) => handleCambioEdit('email', e.target.value)}
                    style={inputStyleEdit('email')} />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>DIRECCIÓN *</label>
                <CampoRequerido error={erroresEdit.direccion}>
                  <input type="text" value={pacienteEditando.direccion}
                    onChange={(e) => handleCambioEdit('direccion', e.target.value)}
                    style={inputStyleEdit('direccion')} required />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>CIUDAD *</label>
                <CampoRequerido error={erroresEdit.ciudad}>
                  <input type="text" value={pacienteEditando.ciudad}
                    onChange={(e) => handleCambioEdit('ciudad', e.target.value)}
                    style={inputStyleEdit('ciudad')} required />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>CONTACTO EMERGENCIA — NOMBRE <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                <CampoRequerido error={erroresEdit.contactoEmergenciaNombre}>
                  <input type="text" value={pacienteEditando.contactoEmergenciaNombre}
                    onChange={(e) => handleCambioEdit('contactoEmergenciaNombre', e.target.value)}
                    style={inputStyleEdit('contactoEmergenciaNombre')} />
                </CampoRequerido>
              </div>

              <div className="form-group">
                <label>CONTACTO EMERGENCIA — TELÉFONO <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(opcional, 10 dígitos)</span></label>
                <CampoRequerido error={erroresEdit.contactoEmergenciaTel}>
                  <input type="tel" value={pacienteEditando.contactoEmergenciaTel} maxLength={10}
                    onChange={(e) => handleCambioEdit('contactoEmergenciaTel', e.target.value)}
                    style={inputStyleEdit('contactoEmergenciaTel')} />
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