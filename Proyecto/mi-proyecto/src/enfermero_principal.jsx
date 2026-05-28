import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers,
  FiLogOut,
  FiPrinter,
  FiActivity,
  FiClipboard,
  FiSearch,
  FiAlertTriangle
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
      setToasts((prev) => [...prev, { id, msg, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }, delay)
  }, [])
  return {
    toasts,
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error'),
  }
}

// =========================================================
// CAMPO REQUERIDO
// =========================================================
function CampoRequerido({ error, children }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {children}
      {error && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginTop: '4px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '14px', height: '14px', background: '#f97316', borderRadius: '3px',
            color: 'white', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>!</span>
          {error}
        </span>
      )}
    </div>
  )
}

// =========================================================
// VISTA: TRIAGE
// =========================================================
function VistaTriage({ onSubmit, success, error: showError }) {
  // --- búsqueda ---
  const [documento, setDocumento]       = useState('')
  const [buscando, setBuscando]         = useState(false)
  const [paciente, setPaciente]         = useState(null)   // { citId, nombre, motivo } | null
  const [noEncontrado, setNoEncontrado] = useState(false)

  // --- formulario clínico ---
const [formData, setFormData] = useState({
  presionArterial: '',
  frecuenciaCardiaca: '',
  temperatura: '',
  saturacion: '',
  sintomas: '',
  triage: 'III',
  urgNombre: '',
  urgGenero: 'DESCONOCIDO',
  urgTipoSangre: 'DESCONOCIDO'
})




  const [errors, setErrors]         = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── buscar paciente por documento ──
  const buscarPaciente = async () => {
    if (!documento.trim()) return
    setBuscando(true)
    setPaciente(null)
    setNoEncontrado(false)
    setErrors({})
    try {
      const res  = await fetch(`${API}/enfermero/paciente/${documento.trim()}`)
      const data = await res.json()
      if (data.encontrado) {
        setPaciente(data)
      } else {
        setNoEncontrado(true)
      }
    } catch (err) {
      showError('Error al buscar paciente: ' + err.message)
    } finally {
      setBuscando(false)
    }
  }

  const handleDocumentoKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarPaciente() }
  }

  // ── cambios en signos vitales / clasificación ──
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

    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  // ── validación ──
  const validar = () => {
    const errs = {}
    if (!paciente) { errs.documento = 'Busque y seleccione un paciente primero'; setErrors(errs); return false }
    if (!formData.sintomas.trim()) errs.sintomas = 'Los síntomas son obligatorios'
    if (!formData.triage)          errs.triage   = 'Seleccione un nivel de triage'

    if (formData.presionArterial && !/^\d{2,3}\/\d{2,3}$/.test(formData.presionArterial))
      errs.presionArterial = 'Formato inválido (Ej: 120/80)'

    if (formData.frecuenciaCardiaca !== '') {
      const v = Number(formData.frecuenciaCardiaca)
      if (v < 0 || v > 300) errs.frecuenciaCardiaca = 'Debe estar entre 0 y 300 LPM'
    }
    if (formData.temperatura !== '') {
      const v = Number(formData.temperatura)
      if (v < 20 || v > 45) errs.temperatura = 'Debe estar entre 20°C y 45°C'
    }
    if (formData.saturacion !== '') {
      const v = Number(formData.saturacion)
      if (v < 0 || v > 100) errs.saturacion = 'Debe estar entre 0 y 100%'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) { showError('Por favor corrija los campos indicados.'); return }

    setIsSubmitting(true)

    // reemplaza la llamada al fetch de triage por esto
if (paciente.esPNI) {
  // PNI: solo registrar localmente, notificar a secretaría después
  onSubmit({
    id: Date.now(),
    documento: `PNI-${Date.now().toString().slice(-4)}`,
    nombre: paciente.nombre,
    triage: formData.triage,
    fechaHora: new Date().toISOString(),
    esPNI: true
  })
  success(`PNI registrado: ${paciente.nombre} — notifique a secretaría`)
  setDocumento(''); setPaciente(null); setNoEncontrado(false)
setFormData({
  presionArterial: '', frecuenciaCardiaca: '', temperatura: '',
  saturacion: '', sintomas: '', triage: 'III',
  urgNombre: '', urgGenero: 'DESCONOCIDO', urgTipoSangre: 'DESCONOCIDO'
})


  setErrors({})
  setIsSubmitting(false)
  return
}

















    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      const res  = await fetch(`${API}/triage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citId:              paciente.citId,
          presionArterial:    formData.presionArterial,
          frecuenciaCardiaca: formData.frecuenciaCardiaca,
          temperatura:        formData.temperatura,
          saturacion:         formData.saturacion,
          sintomas:           formData.sintomas,
          nivel:              formData.triage,
          usuId:              usuario?.id || 1
        })
      })
      const data = await res.json()

      if (data.success) {
        onSubmit({
          id:        data.triId,
          documento: documento.trim(),
          nombre:    paciente.nombre,
          triage:    formData.triage,
          fechaHora: new Date().toISOString()
        })
        success('Triage registrado exitosamente')
        // reset
        setDocumento('')
        setPaciente(null)
        setNoEncontrado(false)
        setFormData({ presionArterial: '', frecuenciaCardiaca: '', temperatura: '', saturacion: '', sintomas: '', triage: 'III' })
        setErrors({})
      } else {
        showError(data.error || 'Error al registrar triage')
      }
    } catch (err) {
      showError('Error: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── alertas de signos vitales ──
  const alertasSignos = () => {
    const alertas = []
    if (formData.temperatura && Number(formData.temperatura) >= 38.5)
      alertas.push('⚠️ Fiebre alta (≥38.5°C)')
    if (formData.saturacion && Number(formData.saturacion) < 90)
      alertas.push('🔴 Saturación crítica (<90%)')
    if (formData.frecuenciaCardiaca && Number(formData.frecuenciaCardiaca) > 100)
      alertas.push('⚠️ Taquicardia (>100 LPM)')
    if (formData.frecuenciaCardiaca && Number(formData.frecuenciaCardiaca) < 60)
      alertas.push('⚠️ Bradicardia (<60 LPM)')
    return alertas
  }

  const alertas = alertasSignos()

  return (
    <>
      <div className="page-header">
        <h2>Registro de Signos Vitales y Triage</h2>
        <p>Busque al paciente por documento y complete la clasificación de riesgo.</p>
      </div>

      <div className="patient-sections" style={{ gridTemplateColumns: '1fr', maxWidth: '800px' }}>
        <div className="form-section">
          <h3><FiActivity className="section-icon" /> Formulario Clínico</h3>

          <form onSubmit={handleSubmit} className="patient-form" noValidate>

            <div className="form-section-label">
  Identificación del Paciente
</div>
<div className="form-row">
  <div className="form-group" style={{ flex: 2 }}>








                <label>Documento *</label>
                <CampoRequerido error={errors.documento}>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => { setDocumento(e.target.value); setPaciente(null); setNoEncontrado(false) }}
                    onKeyDown={handleDocumentoKeyDown}
                    placeholder="Ej: 10203040"
                    style={errors.documento ? { borderColor: '#ef4444', background: '#fff5f5' } : {}}
                  />
                </CampoRequerido>
              </div>
              <div className="form-group" style={{ flex: 1, justifyContent: 'flex-end', paddingTop: '22px' }}>
                <button
                  type="button"
                  className="btn-register"
                  style={{ margin: 0, padding: '10px 16px' }}
                  onClick={buscarPaciente}
                  disabled={buscando || !documento.trim()}
                >
                  {buscando ? 'Buscando...' : <><FiSearch /> Buscar</>}
                </button>
              </div>
            </div>

            {/* ── RESULTADO BÚSQUEDA ── */}
            {paciente && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
                padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '22px' }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#166534' }}>{paciente.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#15803d' }}>
                    Cita #{paciente.citId} — {paciente.motivo}
                  </div>
                </div>
              </div>
            )}



        {noEncontrado && (
  <div style={{ background: '#fff7ed', border: '1px solid #fdba74',
    borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
      <FiAlertTriangle size={20} color="#ea580c" />
      <div style={{ fontWeight: 600, color: '#9a3412' }}>
        Paciente no encontrado — Registrar como Urgencia
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Nombre completo *</label>
        <input type="text" name="urgNombre" value={formData.urgNombre || ''}
          onChange={handleChange} placeholder="Nombre del paciente" />
      </div>
      <div className="form-group">
        <label>Género</label>
        <select name="urgGenero" value={formData.urgGenero || 'D'} onChange={handleChange}>
  <option value="D">Desconocido</option>
  <option value="M">Masculino</option>
  <option value="F">Femenino</option>
</select>
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Tipo de sangre</label>
        <select name="urgTipoSangre" value={formData.urgTipoSangre || 'DESCONOCIDO'} onChange={handleChange}>
          <option value="DESCONOCIDO">Desconocido</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>
    </div>

    <button
      type="button"
      disabled={!formData.urgNombre?.trim()}
      onClick={async () => {
        try {
          const usuario = JSON.parse(localStorage.getItem('usuario'))
          const res = await fetch(`${API}/enfermero/urgencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documento:  documento.trim(),
              nombre:     formData.urgNombre,
              genero:     formData.urgGenero     || 'DESCONOCIDO',
              tipoSangre: formData.urgTipoSangre || 'DESCONOCIDO',
              usuId:      usuario?.id || 1
            })
          })
          const data = await res.json()
          if (data.success) {
            setPaciente({
              citId:  data.citId,
              nombre: data.nombre,
              motivo: 'URGENCIA',
              esPNI:  false
            })
            setNoEncontrado(false)
          } else {
            showError(data.error || 'Error al registrar urgencia')
          }
        } catch (err) {
          showError('Error: ' + err.message)
        }
      }}
      style={{
        background: !formData.urgNombre?.trim() ? '#9ca3af' : '#dc2626',
        color: 'white', border: 'none', borderRadius: '6px',
        padding: '10px 20px', fontWeight: 700, cursor: !formData.urgNombre?.trim() ? 'not-allowed' : 'pointer',
        width: '100%', marginTop: '8px'
      }}
    >
      🚨 Registrar como Urgencia y Continuar
    </button>
  </div>
)}










            {/* ── SIGNOS VITALES (solo si hay paciente) ── */}
            {paciente && (
              <>
                <div className="form-section-label" style={{ marginTop: '10px' }}>Signos Vitales</div>

                {alertas.length > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
                    padding: '10px 14px', marginBottom: '12px' }}>
                    {alertas.map((a, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 500 }}>{a}</div>
                    ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Presión Arterial</label>
                    <CampoRequerido error={errors.presionArterial}>
                      <input type="text" name="presionArterial" value={formData.presionArterial}
                        onChange={handleChange} placeholder="120/80"
                        style={errors.presionArterial ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} />
                    </CampoRequerido>
                  </div>
                  <div className="form-group">
                    <label>Frecuencia Cardíaca</label>
                    <CampoRequerido error={errors.frecuenciaCardiaca}>
                      <input type="text" inputMode="numeric" name="frecuenciaCardiaca"
                        value={formData.frecuenciaCardiaca} onChange={handleChange} placeholder="LPM"
                        style={errors.frecuenciaCardiaca ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} />
                    </CampoRequerido>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Temperatura</label>
                    <CampoRequerido error={errors.temperatura}>
                      <input type="text" inputMode="decimal" name="temperatura"
                        value={formData.temperatura} onChange={handleChange} placeholder="°C"
                        style={errors.temperatura ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} />
                    </CampoRequerido>
                  </div>
                  <div className="form-group">
                    <label>Saturación O2</label>
                    <CampoRequerido error={errors.saturacion}>
                      <input type="text" inputMode="numeric" name="saturacion"
                        value={formData.saturacion} onChange={handleChange} placeholder="%"
                        style={errors.saturacion ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} />
                    </CampoRequerido>
                  </div>
                </div>

                <div className="form-section-label" style={{ marginTop: '10px' }}>Clasificación</div>

                <div className="form-group">
                  <label>Síntomas / Motivo de Consulta *</label>
                  <CampoRequerido error={errors.sintomas}>
                    <textarea name="sintomas" value={formData.sintomas} onChange={handleChange}
                      rows="3" placeholder="Describa brevemente..."
                      style={errors.sintomas ? { borderColor: '#ef4444', background: '#fff5f5' } : {}} />
                  </CampoRequerido>
                </div>

                <div className="form-group">
                  <label>Nivel de Triage *</label>
                  <CampoRequerido error={errors.triage}>
                    <select name="triage" value={formData.triage} onChange={handleChange}
                      style={errors.triage ? { borderColor: '#ef4444', background: '#fff5f5' } : {}}>
                      <option value="I">Triage I — Resucitación</option>
                      <option value="II">Triage II — Emergencia</option>
                      <option value="III">Triage III — Urgencia</option>
                      <option value="IV">Triage IV — Menor Urgencia</option>
                      <option value="V">Triage V — No Urgente</option>
                    </select>
                  </CampoRequerido>
                </div>

                <button type="submit" className="btn-register" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Guardar Triage'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  )
}

// =========================================================
// VISTA: REPORTE
// =========================================================
function VistaReporte({ pacientes, usuarioId }) {
  const [cargando, setCargando]           = useState(true)
  const [listado, setListado]             = useState([])

  useEffect(() => {
    const cargar = async () => {
      try {
        const res  = await fetch(`${API}/triage/hoy/${usuarioId}`)
        const data = await res.json()
        setListado(data)
      } catch (err) {
        console.error('Error cargando reporte:', err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [usuarioId])

  // combinar BD + los registrados en sesión actual (pueden solaparse, deduplicar por triId)
  const todos = [...listado]
  pacientes.forEach(p => {
    if (!todos.find(t => t.triId === p.id)) {
      todos.unshift({ triId: p.id, documento: p.documento, nombre: p.nombre, nivel: p.triage, fechaHora: p.fechaHora })
    }
  })

  const stats = { I: 0, II: 0, III: 0, IV: 0, V: 0, total: todos.length }
  todos.forEach(p => { if (stats[p.nivel] !== undefined) stats[p.nivel]++ })

  const getTriageClass = (n) => ({ I: 'triage-1', II: 'triage-2', III: 'triage-3', IV: 'triage-4', V: 'triage-5' }[n] || 'triage-5')

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Reporte de Pacientes Atendidos</h2>
          <p>Métricas de gestión diarias por nivel de riesgo.</p>
        </div>
        <button className="btn-logout btn-print" style={{ color: '#1e293b', borderColor: '#cbd5e1' }}
          onClick={() => window.print()}>
          <FiPrinter /> Imprimir PDF
        </button>
      </div>

      <div className="stats-grid">
        {[
          { key: 'I',   label: 'TRIAGE I',   bg: '#fef2f2', color: '#dc2626' },
          { key: 'II',  label: 'TRIAGE II',  bg: '#fff7ed', color: '#ea580c' },
          { key: 'III', label: 'TRIAGE III', bg: '#fefce8', color: '#ca8a04' },
          { key: 'IV',  label: 'TRIAGE IV',  bg: '#f0fdf4', color: '#16a34a' },
          { key: 'V',   label: 'TRIAGE V',   bg: '#eff6ff', color: '#2563eb' },
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
                  <th>Hora</th>
                  <th>Documento</th>
                  <th>Paciente</th>
                  <th>Nivel de Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="4" className="no-results">Cargando...</td></tr>
                ) : todos.length === 0 ? (
                  <tr><td colSpan="4" className="no-results">No hay pacientes registrados hoy.</td></tr>
                ) : (
                  todos.map(pac => (
                    <tr key={pac.triId}>
                      <td>{new Date(pac.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{pac.documento}</td>
                      <td style={{ fontWeight: 500, color: '#1e293b' }}>{pac.nombre}</td>
                      <td><span className={`triage-badge ${getTriageClass(pac.nivel)}`}>Triage {pac.nivel}</span></td>
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
  const [vista, setVista]             = useState('triage')
  const [usuario, setUsuario]         = useState({})
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
    } catch { navigate('/') }
  }, [navigate])

  const fmtDateTime = (d) =>
    d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })

  const initiales = (nombre) =>
    nombre ? nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'ENF'

  const handleLogout = () => { localStorage.removeItem('usuario'); navigate('/') }

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
            <button className={`module-item ${vista === 'triage' ? 'active' : ''}`}
              onClick={() => setVista('triage')}>
              <span className="module-icon"><FiActivity /></span>
              <span className="module-name">Registro Triage</span>
            </button>
            <button className={`module-item ${vista === 'reporte' ? 'active' : ''}`}
              onClick={() => setVista('reporte')}>
              <span className="module-icon"><FiClipboard /></span>
              <span className="module-name">Reporte Diario</span>
              <span className="module-count">{pacientesHoy.length}</span>
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {vista === 'triage' && (
            <VistaTriage
              onSubmit={handleTriageSubmit}
              success={success}
              error={showError}
            />
          )}
          {vista === 'reporte' && (
            <VistaReporte
              pacientes={pacientesHoy}
              usuarioId={usuario.id}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default EnfermeroPrincipal