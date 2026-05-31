import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiUsers, FiLogOut, FiRefreshCw,
         FiUserPlus, FiChevronLeft, FiCheckCircle, FiCalendar } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './emer.css'

const API = 'https://cmq-backend.onrender.com/api'
const pad = n => String(n).padStart(2, '0')

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 18px',
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`,
      borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      animation: 'fadeInDown .3s ease'
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '24px', height: '24px',
        background: type === 'success' ? '#22c55e' : '#ef4444',
        borderRadius: '50%', color: 'white', fontSize: '13px', flexShrink: 0
      }}>{type === 'success' ? '✓' : '!'}</span>
      <span style={{ fontSize: '13px', fontWeight: 600,
        color: type === 'success' ? '#166534' : '#dc2626' }}>{msg}</span>
    </div>
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

const nivelEmoji = { CRITICO: '🔴', ESTABLE: '🟡', LEVE: '🟢' }
const triLabel   = { I: 'Triage I', II: 'Triage II', III: 'Triage III', IV: 'Triage IV', V: 'Triage V' }

const fmtHora = ts => {
  if (!ts) return '—'
  const d = new Date(String(ts).replace(' ', 'T'))
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fmtFecha = ts => {
  if (!ts) return '—'
  const d = new Date(String(ts).replace(' ', 'T'))
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

export default function Urgencias() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [urgencias, setUrgencias]     = useState([])
  const [cargando, setCargando]        = useState(true)
  const [tab, setTab]                  = useState('registrados')
  const [toast, setToast]              = useState({ msg: '', type: 'success' })
  const [pniSeleccionado, setPni]      = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [errores, setErrores]          = useState({})
  const [guardando, setGuardando]      = useState(false)

  const [form, setForm] = useState({
    nombre: '', telefono: '', fechaNacimiento: '', genero: '',
    tipoSangre: '', email: '', direccion: '', ciudad: '',
    emergenciaNombre: '', emergenciaTel: ''
  })

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res  = await fetch(`${API}/urgencias/hoy`)
      const data = await res.json()
      setUrgencias(Array.isArray(data) ? data : [])
    } catch { setUrgencias([]) }
    finally { setCargando(false) }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  const registrados = urgencias.filter(u => !u.esPNI)
  const pnis        = urgencias.filter(u => u.esPNI)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }))
  }

  const abrirFormPNI = (pac) => {
    setPni(pac)
    setForm({
      nombre: pac.nombre !== 'Sin registrar' ? pac.nombre : '',
      telefono: '', fechaNacimiento: '', genero: '',
      tipoSangre: '', email: '', direccion: '', ciudad: '',
      emergenciaNombre: '', emergenciaTel: ''
    })
    setErrores({})
    setModalAbierto(true)
  }




const validar = () => {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
  else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(form.nombre.trim())) e.nombre = 'Solo se permiten letras'

  if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
  else if (!/^\d{10}$/.test(form.telefono.trim())) e.telefono = 'El teléfono debe tener exactamente 10 dígitos'

  if (!form.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
  else {
    const [anio, mes, dia] = form.fechaNacimiento.split('-')
    const nac = new Date(anio, mes - 1, dia)
    const manana = new Date(); manana.setHours(0,0,0,0); manana.setDate(manana.getDate() + 1)
    if (nac >= manana) e.fechaNacimiento = 'La fecha de nacimiento no puede ser futura'
  }

  if (!form.genero) e.genero = 'Seleccione un género'
  if (!form.tipoSangre) e.tipoSangre = 'Seleccione el tipo de sangre'
  if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria'
  if (!form.ciudad.trim()) e.ciudad = 'La ciudad es obligatoria'
  else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(form.ciudad.trim())) e.ciudad = 'La ciudad solo debe contener letras'

  setErrores(e)
  return Object.keys(e).length === 0
}




  const handleRegistrar = async () => {
    if (!validar()) return
    setGuardando(true)
    try {
      const res  = await fetch(`${API}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:                      pniSeleccionado.documento,
          nombre:                  form.nombre,
          telefono:                form.telefono,
          fechaNacimiento:         form.fechaNacimiento,
          genero:                  form.genero,
          tipoSangre:              form.tipoSangre,
          email:                   form.email,
          direccion:               form.direccion,
          ciudad:                  form.ciudad,
          contactoEmergenciaNombre: form.emergenciaNombre,
          contactoEmergenciaTel:   form.emergenciaTel
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Paciente ${form.nombre} registrado exitosamente`)
        setPni(null)
        setModalAbierto(false)
        await cargar()
      } else {
        showToast(data.error || 'Error al registrar', 'error')
      }
    } catch {
      showToast('Error conectando al servidor', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const fmtDateTime = d => d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  const usuario = (() => { try { return JSON.parse(localStorage.getItem('usuario')) || {} } catch { return {} } })()


  return (
    <div className="citas-container">
      <Toast msg={toast.msg} type={toast.type} />

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
          <button className="btn-logout" onClick={() => navigate('/')}><FiLogOut /> Cerrar sesión</button>
          <div className="datetime-box">
            <span className="current-date">{fmtDateTime(currentTime)}</span>
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
            <button className="module-item" onClick={() => navigate('/secretaria')}>
              <span className="module-icon"><FiUsers /></span>
              <span className="module-name">Pacientes</span>
              <span className="module-count">0</span>
            </button>
            <button className="module-item" onClick={() => navigate('/citas')}>
              <span className="module-icon"><FiCalendar /></span>
              <span className="module-name">Citas Médicas</span>
              <span className="module-count">0</span>
            </button>
            <button className="module-item active">
              <span className="module-icon"><FiAlertTriangle /></span>
              <span className="module-name">Urgencias</span>
              <span className="module-count">{urgencias.length}</span>
            </button>
          </nav>
        </aside>

        <main className="content-area">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Urgencias del Día</h2>
              <p>Pacientes atendidos por urgencia hoy — registrados y no registrados</p>
            </div>
            <button className="btn-cancelar" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={cargar}>
              <FiRefreshCw size={13} /> Actualizar
            </button>
          </div>

          {/* TABS */}
          <div className="emer-tabs">
            <button className={`emer-tab ${tab === 'registrados' ? 'active' : ''}`}
              onClick={() => setTab('registrados')}>
              Pacientes registrados
              <span className="tab-count">{registrados.length}</span>
            </button>
            <button className={`emer-tab ${tab === 'pni' ? 'active' : ''}`}
              onClick={() => setTab('pni')}>
              No registrados (PNI)
              <span className="tab-count">{pnis.length}</span>
            </button>
          </div>

          {/* TABLA */}
          <div className="directory-section" style={{ margin: 0 }}>
            <div className="patient-table" style={{ overflowX: 'auto' }}>
              {cargando ? (
                <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</p>
              ) : (
                <table style={{ tableLayout: 'fixed', width: '100%', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>HORA</th>
                      <th style={{ width: '14%' }}>DOCUMENTO</th>
                      <th style={{ width: '18%' }}>PACIENTE</th>
                      <th style={{ width: '10%' }}>NIVEL</th>
                      <th style={{ width: '10%' }}>ESTADO</th>
                      <th style={{ width: '16%' }}>MÉDICO</th>
                      <th style={{ width: '14%' }}>ENFERMERO</th>
                      {tab === 'pni' && <th style={{ width: '10%' }}>ACCIÓN</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === 'registrados' ? registrados : pnis).length === 0 ? (
                      <tr><td colSpan="8" className="no-results">
                        {tab === 'registrados' ? 'No hay pacientes registrados con urgencia hoy' : 'No hay pacientes PNI hoy'}
                      </td></tr>
                    ) : (tab === 'registrados' ? registrados : pnis).map(u => (
                      <tr key={u.citId}>
                        <td style={{ fontWeight: 600 }}>{fmtHora(u.fechaHora)}</td>
                        <td>{u.documento}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>
                          {u.nombre}
                          {u.esPNI && <span className="pni-badge" style={{ marginLeft: '6px' }}>PNI</span>}
                        </td>
                        <td>
                          <span className={`nivel-badge nivel-${u.nivelPaciente}`}>
                            {nivelEmoji[u.nivelPaciente]} {u.nivelPaciente}
                          </span>
                        </td>
                        <td>
                          <span className={`estado-badge estado-${u.estado}`}>{u.estado.replace('_', ' ')}</span>
                        </td>
                        <td style={{ fontSize: '12px' }}>{u.medico}</td>
                        <td style={{ fontSize: '12px' }}>{u.enfermero}</td>
                        {tab === 'pni' && (
                          <td>
                            <button className="btn-registrar-pni" onClick={() => abrirFormPNI(u)}>
                              <FiUserPlus size={12} /> Registrar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {modalAbierto && pniSeleccionado && (
        <div className="modal-overlay" onClick={() => { setModalAbierto(false); setPni(null) }}>
          <div className="modal modal-perfil" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <FiUserPlus size={18} />
                </div>
                <div>
                  <h3>Registrar Paciente PNI</h3>
                  <p>Doc: {pniSeleccionado.documento} — Cita #{pniSeleccionado.citId}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => { setModalAbierto(false); setPni(null) }}>✕</button>
            </div>

            <div className="modal-body" style={{ gap: '10px' }}>
              <div className="form-section-label">IDENTIFICACIÓN</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>NOMBRE COMPLETO *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo"
                    style={{ borderColor: errores.nombre ? '#ef4444' : '', background: errores.nombre ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.nombre} />
                </div>
                <div className="form-group">
                  <label>TELÉFONO *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 3214556879"
                    style={{ borderColor: errores.telefono ? '#ef4444' : '', background: errores.telefono ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.telefono} />
                </div>
                <div className="form-group">
                  <label>FECHA DE NACIMIENTO *</label>
                  <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange}
  max={new Date().toISOString().split('T')[0]}
                    style={{ borderColor: errores.fechaNacimiento ? '#ef4444' : '', background: errores.fechaNacimiento ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.fechaNacimiento} />
                </div>
                <div className="form-group">
                  <label>GÉNERO *</label>
                  <select name="genero" value={form.genero} onChange={handleChange}
                    style={{ borderColor: errores.genero ? '#ef4444' : '', background: errores.genero ? '#fff5f5' : '' }}>
                    <option value="">Seleccione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                  <ErrorField msg={errores.genero} />
                </div>
                <div className="form-group">
                  <label>TIPO DE SANGRE *</label>
                  <select name="tipoSangre" value={form.tipoSangre} onChange={handleChange}
                    style={{ borderColor: errores.tipoSangre ? '#ef4444' : '', background: errores.tipoSangre ? '#fff5f5' : '' }}>
                    <option value="">Seleccione</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ErrorField msg={errores.tipoSangre} />
                </div>
                <div className="form-group">
                  <label>EMAIL (OPCIONAL)</label>
                  <input name="email" value={form.email} onChange={handleChange} placeholder="correo@email.com" />
                </div>
              </div>

              <div className="form-section-label" style={{ marginTop: '4px' }}>CONTACTO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>DIRECCIÓN *</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, carrera..."
                    style={{ borderColor: errores.direccion ? '#ef4444' : '', background: errores.direccion ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.direccion} />
                </div>
                <div className="form-group">
                  <label>CIUDAD *</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ej. Bogotá"
                    style={{ borderColor: errores.ciudad ? '#ef4444' : '', background: errores.ciudad ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.ciudad} />
                </div>
                <div className="form-group">
                  <label>NOMBRE CONTACTO EMERGENCIA *</label>
                  <input name="emergenciaNombre" value={form.emergenciaNombre} onChange={handleChange} placeholder="Nombre"
                    style={{ borderColor: errores.emergenciaNombre ? '#ef4444' : '', background: errores.emergenciaNombre ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.emergenciaNombre} />
                </div>
                <div className="form-group">
                  <label>TELÉFONO EMERGENCIA *</label>
                  <input name="emergenciaTel" value={form.emergenciaTel} onChange={handleChange} placeholder="Teléfono"
                    style={{ borderColor: errores.emergenciaTel ? '#ef4444' : '', background: errores.emergenciaTel ? '#fff5f5' : '' }} />
                  <ErrorField msg={errores.emergenciaTel} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => { setModalAbierto(false); setPni(null) }}>Cancelar</button>
              <button className="btn-guardar" onClick={handleRegistrar} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {guardando ? 'Registrando...' : <><FiCheckCircle size={13} /> Registrar paciente</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <span>CMQ — Módulo Urgencias</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {fmtDateTime(currentTime)}
        </span>
      </footer>
    </div>
  )
}