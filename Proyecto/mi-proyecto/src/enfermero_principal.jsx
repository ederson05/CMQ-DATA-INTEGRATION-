import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers,
  FiFileText,
  FiLogOut,
  FiCheckCircle,
  FiPrinter,
  FiActivity,
  FiClipboard
} from 'react-icons/fi'
import './enfermero_principal.css'

const API = 'https://cmq-backend.onrender.com/api'

// =========================================================
// TOASTS
// =========================================================
function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrapper">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? "✓" : "!"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const show = useCallback((msg, type = "success", delay = 0) => {
    setTimeout(() => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, msg, type }])
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000
      )
    }, delay)
  }, [])
  return {
    toasts,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    errors: (lista) => lista.forEach((m, i) => show(m, "error", i * 180)),
  }
}

// =========================================================
// CAMPO REQUERIDO
// =========================================================
function CampoRequerido({ error, children }) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {children}
      {error && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
            fontSize: "12px",
            color: "#dc2626",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "14px",
              height: "14px",
              background: "#f97316",
              borderRadius: "3px",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            !
          </span>
          {error}
        </span>
      )}
    </div>
  )
}

// =========================================================
// VISTA: TRIAGE
// =========================================================
function VistaTriage({ onSubmit, success, showError }) {
  const [formData, setFormData] = useState({
    documento: '',
    nombre: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    temperatura: '',
    saturacion: '',
    sintomas: '',
    triage: 'III'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    let { name, value } = e.target

    if (name === 'presionArterial') {
      value = value.replace(/[^\d/]/g, '')
      if (value.length > 7) return
    } else if (name === 'frecuenciaCardiaca' || name === 'saturacion') {
      value = value.replace(/[^\d]/g, '')
    } else if (name === 'temperatura') {
      value = value.replace(/[^\d.-]/g, '')
      const partes = value.split('.')
      if (partes.length > 2) value = partes[0] + '.' + partes.slice(1).join('')
      if (value.lastIndexOf('-') > 0) value = value.replace(/(?!^)-/g, '')
    }

    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const validarFormulario = () => {
    const errs = {}
    if (!formData.documento.trim()) errs.documento = "El documento es requerido"
    if (!formData.nombre.trim()) errs.nombre = "El nombre es requerido"
    if (!formData.sintomas.trim()) errs.sintomas = "Los síntomas son obligatorios"
    if (!formData.triage) errs.triage = "Seleccione un nivel de triage"

    if (formData.presionArterial && !/^\d{2,3}\/\d{2,3}$/.test(formData.presionArterial)) {
      errs.presionArterial = "Formato inválido (Ej: 120/80)"
    }

    if (formData.frecuenciaCardiaca !== '') {
      const numFC = Number(formData.frecuenciaCardiaca)
      if (numFC < 0 || numFC > 300) errs.frecuenciaCardiaca = "Debe estar entre 0 y 300 LPM"
    }
    if (formData.temperatura !== '') {
      const numTemp = Number(formData.temperatura)
      if (numTemp < -20 || numTemp > 100) errs.temperatura = "Debe estar entre -20°C y 100°C"
    }
    if (formData.saturacion !== '') {
      const numSat = Number(formData.saturacion)
      if (numSat < 0 || numSat > 100) errs.saturacion = "Debe estar entre 0 y 100%"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }







 const handleSubmit = async (e) => {
  e.preventDefault()

  if (!validarFormulario()) {
    showError("Por favor complete los campos obligatorios correctamente.")
    return
  }

  setIsSubmitting(true)

  try {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    
    const response = await fetch(`${API}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documento: formData.documento,
        nombre: formData.nombre,
        presionArterial: formData.presionArterial,
        frecuenciaCardiaca: formData.frecuenciaCardiaca,
        temperatura: formData.temperatura,
        saturacion: formData.saturacion,
        sintomas: formData.sintomas,
        nivel: formData.triage,
        usuId: usuario?.id || 1
      })
    })

    const data = await response.json()

    if (data.success) {
      const nuevoPaciente = {
        id: data.triId,
        documento: formData.documento,
        nombre: formData.nombre,
        triage: formData.triage,
        fechaHora: new Date().toISOString()
      }
      onSubmit(nuevoPaciente)
      success("Triage registrado exitosamente")
      setFormData({
        documento: '',
        nombre: '',
        presionArterial: '',
        frecuenciaCardiaca: '',
        temperatura: '',
        saturacion: '',
        sintomas: '',
        triage: 'III'
      })
      setErrors({})
    } else {
      showError(data.error || "Error al registrar triage")
    }
  } catch (err) {
    console.error('Error:', err)
    showError("Error: " + err.message)
  } finally {
    setIsSubmitting(false)
  }
}





  return (
    <>
      <div className="page-header">
        <h2>Registro de Signos Vitales y Triage</h2>
        <p>Documente la clasificación de riesgo del paciente antes de la atención médica.</p>
      </div>

      <div className="patient-sections" style={{ gridTemplateColumns: '1fr', maxWidth: '800px' }}>
        <div className="form-section">
          <h3><FiActivity className="section-icon" /> Formulario Clínico</h3>

          <form onSubmit={handleSubmit} className="patient-form" noValidate>
            <div className="form-row">
              <div className="form-group">
                <label>Documento *</label>
                <CampoRequerido error={errors.documento}>
                  <input 
                    type="text" 
                    name="documento" 
                    value={formData.documento} 
                    onChange={handleChange} 
                    placeholder="Ej: 10203040" 
                    style={errors.documento ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
              <div className="form-group">
                <label>Nombre del Paciente *</label>
                <CampoRequerido error={errors.nombre}>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    placeholder="Ej: Maria Lopez" 
                    style={errors.nombre ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
            </div>

            <div className="form-section-label" style={{ marginTop: '10px' }}>Signos Vitales</div>

            <div className="form-row">
              <div className="form-group">
                <label>Presión Arterial</label>
                <CampoRequerido error={errors.presionArterial}>
                  <input 
                    type="text" 
                    name="presionArterial" 
                    value={formData.presionArterial} 
                    onChange={handleChange} 
                    placeholder="120/80" 
                    style={errors.presionArterial ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
              <div className="form-group">
                <label>Frecuencia Cardíaca</label>
                <CampoRequerido error={errors.frecuenciaCardiaca}>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    name="frecuenciaCardiaca" 
                    value={formData.frecuenciaCardiaca} 
                    onChange={handleChange} 
                    placeholder="LPM" 
                    style={errors.frecuenciaCardiaca ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Temperatura</label>
                <CampoRequerido error={errors.temperatura}>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    name="temperatura" 
                    value={formData.temperatura} 
                    onChange={handleChange} 
                    placeholder="°C" 
                    style={errors.temperatura ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
              <div className="form-group">
                <label>Saturación O2</label>
                <CampoRequerido error={errors.saturacion}>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    name="saturacion" 
                    value={formData.saturacion} 
                    onChange={handleChange} 
                    placeholder="%" 
                    style={errors.saturacion ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} 
                  />
                </CampoRequerido>
              </div>
            </div>

            <div className="form-section-label" style={{ marginTop: '10px' }}>Clasificación</div>

            <div className="form-group">
              <label>Síntomas / Motivo de Consulta *</label>
              <CampoRequerido error={errors.sintomas}>
                <textarea 
                  name="sintomas" 
                  value={formData.sintomas} 
                  onChange={handleChange} 
                  rows="3" 
                  placeholder="Describa brevemente..." 
                  style={errors.sintomas ? { borderColor: '#ef4444', background: '#fff5f5' } : {}}
                />
              </CampoRequerido>
            </div>

            <div className="form-group">
              <label>Nivel de Triage *</label>
              <CampoRequerido error={errors.triage}>
                <select 
                  name="triage" 
                  value={formData.triage} 
                  onChange={handleChange} 
                  style={errors.triage ? { borderColor: '#ef4444', background: '#fff5f5' } : {}}
                >
                  <option value="I">Triage I - Resucitación</option>
                  <option value="II">Triage II - Emergencia</option>
                  <option value="III">Triage III - Urgencia</option>
                  <option value="IV">Triage IV - Menor Urgencia</option>
                  <option value="V">Triage V - No Urgente</option>
                </select>
              </CampoRequerido>
            </div>

            <button type="submit" className="btn-register" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Guardar Triage'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// =========================================================
// VISTA: REPORTE
// =========================================================
function VistaReporte({ pacientes }) {
  const stats = {
    'I': pacientes.filter(p => p.triage === 'I').length,
    'II': pacientes.filter(p => p.triage === 'II').length,
    'III': pacientes.filter(p => p.triage === 'III').length,
    'IV': pacientes.filter(p => p.triage === 'IV').length,
    'V': pacientes.filter(p => p.triage === 'V').length,
    total: pacientes.length
  }

  const getTriageClass = (nivel) => {
    const map = {
      'I': 'triage-1',
      'II': 'triage-2',
      'III': 'triage-3',
      'IV': 'triage-4',
      'V': 'triage-5'
    }
    return map[nivel] || 'triage-5'
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Reporte de Pacientes Atendidos</h2>
          <p>Métricas de gestión diarias por nivel de riesgo.</p>
        </div>
        <button className="btn-logout btn-print" style={{ color: '#1e293b', borderColor: '#cbd5e1' }} onClick={() => window.print()}>
          <FiPrinter /> Imprimir PDF
        </button>
      </div>

      <div className="stats-grid">
        {[
          { key: 'I', label: 'TRIAGE I', bg: '#fef2f2', color: '#dc2626' },
          { key: 'II', label: 'TRIAGE II', bg: '#fff7ed', color: '#ea580c' },
          { key: 'III', label: 'TRIAGE III', bg: '#fefce8', color: '#ca8a04' },
          { key: 'IV', label: 'TRIAGE IV', bg: '#f0fdf4', color: '#16a34a' },
          { key: 'V', label: 'TRIAGE V', bg: '#eff6ff', color: '#2563eb' },
        ].map(t => (
          <div key={t.key} className="stat-card">
            <div className="stat-icon-box" style={{ background: t.bg, color: t.color }}>T-{t.key}</div>
            <div className="stat-value">{stats[t.key]}</div>
            <div className="stat-label">{t.label}</div>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-icon-box blue"><FiUsers size={22} /></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">TOTAL HOY</div>
        </div>
      </div>

      <div className="patient-sections" style={{ gridTemplateColumns: '1fr' }}>
        <div className="directory-section">
          <h3><FiClipboard className="section-icon" /> Registro de Atenciones (Hoy)</h3>

          <div className="patient-table">
            <table>
              <thead>
                <tr>
                  <th>Hora Registro</th>
                  <th>Documento</th>
                  <th>Paciente</th>
                  <th>Nivel de Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-results">No hay pacientes registrados hoy.</td>
                  </tr>
                ) : (
                  pacientes.map(pac => (
                    <tr key={pac.id}>
                      <td>{new Date(pac.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{pac.documento}</td>
                      <td style={{ fontWeight: 500, color: '#1e293b' }}>{pac.nombre}</td>
                      <td>
                        <span className={`triage-badge ${getTriageClass(pac.triage)}`}>
                          Triage {pac.triage}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

// =========================================================
// PRINCIPAL
// =========================================================
function EnfermeroPrincipal() {
  const navigate = useNavigate()
  const { toasts, success, error: showError } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [vista, setVista] = useState('triage')
  const [usuario, setUsuario] = useState({})
  const [pacientesHoy, setPacientesHoy] = useState([])

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('usuario'))
      if (!user) navigate('/')
      else setUsuario(user)
    } catch {
      navigate('/')
    }
  }, [navigate])

  const fmtDateTime = (d) =>
    d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    })

  const initiales = (nombre) =>
    nombre ? nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : 'ENF'

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    navigate('/')
  }

  const handleTriageSubmit = (nuevoPaciente) => {
    setPacientesHoy(prev => [nuevoPaciente, ...prev])
  }

  return (
    <div className="secretaria-container">
      <ToastContainer toasts={toasts} />

      <header className="main-header">
        <div className="header-left">
          <div className="logo-icon">+</div>
          <div className="hospital-info">
            <h1>Hospital CMQ</h1>
            <p>SISTEMA DE INFORMACIÓN CLÍNICA</p>
            <span className="version">v2.41 - Grace OS (Enfermería)</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut /> Cerrar sesión
          </button>
          <div className="datetime-box">
            <span className="current-date">{fmtDateTime(currentTime)}</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar enf-avatar">{initiales(usuario.nombre)}</div>
            <span>{usuario.nombre?.split(' ').slice(0, 2).join(' ') || 'Enfermero'}</span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h3>MÓDULOS</h3>
          <nav className="modules-nav">
            <button
              className={`module-item ${vista === 'triage' ? 'active' : ''}`}
              onClick={() => setVista('triage')}
            >
              <span className="module-icon"><FiActivity /></span>
              <span className="module-name">Registro Triage</span>
            </button>
            <button
              className={`module-item ${vista === 'reporte' ? 'active' : ''}`}
              onClick={() => setVista('reporte')}
            >
              <span className="module-icon"><FiClipboard /></span>
              <span className="module-name">Reporte Diario</span>
              <span className="module-count">{pacientesHoy.length}</span>
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {vista === 'triage' && <VistaTriage onSubmit={handleTriageSubmit} success={success} showError={showError} />}
          {vista === 'reporte' && <VistaReporte pacientes={pacientesHoy} />}
        </main>
      </div>
    </div>
  )
}

export default EnfermeroPrincipal