import { useState, useEffect, useCallback } from 'react'
import {
  FiUsers, FiFileText, FiUser,
  FiSearch, FiLogOut, FiEye,
  FiPlusCircle, FiChevronLeft,
  FiAlertCircle, FiCalendar, FiFilter, FiX, FiCheckCircle
} from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import './medico_principal.css'

const API = 'http://localhost:3001/api'

/* ══════════════════════════════
   TOASTS  (igual que secretaria)
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
    errors:  lista => lista.forEach((m, i) => show(m, 'error', i * 180))
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
   HELPERS
══════════════════════════════ */
const TIPOS      = ['PRIMERA_VEZ', 'CONTROL', 'URGENCIA']
const TIPO_LABEL = { PRIMERA_VEZ: 'Primera vez', CONTROL: 'Control', URGENCIA: 'Urgencia' }
const TIPO_COLOR = { PRIMERA_VEZ: 'tipo-azul', CONTROL: 'tipo-verde', URGENCIA: 'tipo-rojo' }

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
  return new Date(ts).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}

const initiales = (nombre) =>
  nombre ? nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'DR'

/* ══════════════════════════════
   VALIDACIONES
══════════════════════════════ */
const validarAnotacion = (f) => {
  const e = {}
  if (!f.tipoConsulta)        e.tipoConsulta  = 'Seleccione el tipo de consulta'
  if (!f.diagnostico?.trim()) e.diagnostico   = 'El diagnóstico es requerido'
  if (!f.tratamiento?.trim()) e.tratamiento   = 'El tratamiento es requerido'
  if (!f.observaciones?.trim()) e.observaciones = 'Las observaciones son requeridas'
  return e
}

/* ══════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════ */
function MedicoPrincipal() {
  const navigate = useNavigate()
  const { toasts, success, error: showError } = useToast()

  const [usuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')) || {} }
    catch { return {} }
  })

  const [currentTime, setCurrentTime]           = useState(new Date())
  const [vista, setVista]                       = useState('pacientes')
  const [todosPacientes, setTodosPacientes]     = useState([])
  const [pacienteSeleccionado, setPaciente]     = useState(null)
  const [historial, setHistorial]               = useState([])
  const [aclaratorias, setAclaratorias]         = useState([])
  const [anotSeleccionada, setAnotSeleccionada] = useState(null)
  const [busqueda, setBusqueda]                 = useState('')
  const [loading, setLoading]                   = useState(false)

  // Filtros historial
  const [filtroTipo, setFiltroTipo]   = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  // Formulario anotación
  const [formAnot, setFormAnot] = useState({
    tipoConsulta: '', diagnostico: '', tratamiento: '', observaciones: '', proximaCita: ''
  })
  const [errAnot, setErrAnot]         = useState({})
  const [intentoAnot, setIntentoAnot] = useState(false)

  // Formulario aclaratoria
  const [descAcl, setDescAcl]         = useState('')
  const [errAcl, setErrAcl]           = useState('')
  const [intentoAcl, setIntentoAcl]   = useState(false)

  // Modales
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalAcl, setModalAcl]         = useState(null)

  /* Reloj */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* Carga inicial */
  useEffect(() => { cargarTodosPacientes() }, [])

  const cargarTodosPacientes = async () => {
    try {
      const res  = await fetch(`${API}/pacientes`)
      const data = await res.json()
      setTodosPacientes(Array.isArray(data) ? data.map(r => ({
        documento:       String(r[0]),
        nombre:          r[1],
        telefono:        String(r[2] || ''),
        fechaNacimiento: r[3] ? String(r[3]).split('T')[0] : '',
        genero:          r[4],
        tipoSangre:      r[5],
        email:           r[6] || '',
        direccion:       r[7] || '',
        ciudad:          r[8] || ''
      })) : [])
    } catch { setTodosPacientes([]) }
  }

  const cargarHistorial = async (doc) => {
    try {
      const res  = await fetch(`${API}/historias/${doc}`)
      const data = await res.json()
      setHistorial(Array.isArray(data) ? data : [])
    } catch { setHistorial([]) }
  }

  const cargarAclaratorias = async (anoId) => {
    try {
      const res  = await fetch(`${API}/anotaciones/${anoId}/aclaratorias`)
      const data = await res.json()
      setAclaratorias(Array.isArray(data) ? data : [])
    } catch { setAclaratorias([]) }
  }

  const verHistorial = (pac) => {
    setPaciente(pac)
    setVista('historial')
    limpiarFiltros()
    cargarHistorial(pac.documento)
  }

  const histFiltrado = historial.filter(a => {
    if (filtroTipo && a.tipoConsulta !== filtroTipo) return false
    if (filtroDesde && new Date(a.fechaConsulta) < new Date(filtroDesde)) return false
    if (filtroHasta) {
      const hasta = new Date(filtroHasta); hasta.setHours(23, 59, 59)
      if (new Date(a.fechaConsulta) > hasta) return false
    }
    return true
  })

  const limpiarFiltros = () => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta('') }

  const pacFiltrados = todosPacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.documento.includes(busqueda)
  )

  /* Guardar anotación */
  const handleGuardarAnotacion = async () => {
    setIntentoAnot(true)
    const errs = validarAnotacion(formAnot)
    setErrAnot(errs)
    if (Object.keys(errs).length > 0) { showError('Complete todos los campos obligatorios'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/anotaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacDocumento:  pacienteSeleccionado.documento,
          medId:         usuario.medId || usuario.id,
          usuId:         usuario.id,
          tipoConsulta:  formAnot.tipoConsulta,
          diagnostico:   formAnot.diagnostico,
          tratamiento:   formAnot.tratamiento,
          observaciones: formAnot.observaciones,
          proximaCita:   formAnot.proximaCita || null
        })
      })
      const data = await res.json()
      if (data.success) {
        success('Anotación médica registrada exitosamente')
        setFormAnot({ tipoConsulta: '', diagnostico: '', tratamiento: '', observaciones: '', proximaCita: '' })
        setErrAnot({}); setIntentoAnot(false)
        await cargarHistorial(pacienteSeleccionado.documento)
        setVista('historial')
      } else {
        showError('Error al registrar la anotación')
      }
    } catch { showError('Error al conectar con el servidor') }
    finally { setLoading(false) }
  }

  /* Guardar aclaratoria */
  const handleGuardarAclaratoria = async () => {
    setIntentoAcl(true)
    if (!descAcl.trim() || descAcl.trim().length < 10) {
      setErrAcl('La descripción debe tener al menos 10 caracteres')
      showError('La descripción debe tener al menos 10 caracteres')
      return
    }
    setErrAcl('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/aclaratorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anoId:       anotSeleccionada.anoId,
          medId:       usuario.medId || usuario.id,
          usuId:       usuario.id,
          descripcion: descAcl
        })
      })
      const data = await res.json()
      if (data.success) {
        success('Nota aclaratoria registrada exitosamente')
        setDescAcl(''); setErrAcl(''); setIntentoAcl(false)
        await cargarHistorial(pacienteSeleccionado.documento)
        setVista('historial'); setAnotSeleccionada(null)
      } else {
        showError('Error al registrar la nota aclaratoria')
      }
    } catch { showError('Error al conectar con el servidor') }
    finally { setLoading(false) }
  }

  const inputErrStyle = (c) => errAnot[c] ? { borderColor: '#ef4444', background: '#fff5f5' } : {}

  const fmtDateTime = (d) => d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="medico-container">
      <ToastContainer toasts={toasts} />

      {/* HEADER — mismo diseño que secretaria */}
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
          <button className="btn-logout" onClick={() => { localStorage.removeItem('usuario'); navigate('/') }}>
            <FiLogOut /> Cerrar sesión
          </button>
          <div className="datetime-box">
            <span className="current-date">{fmtDateTime(currentTime)}</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar med-avatar">{initiales(usuario.nombre)}</div>
            <span>{usuario.nombre?.split(' ').slice(0, 2).join(' ') || 'Médico'}</span>
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="main-content">
        <aside className="sidebar">
          <h3>MÓDULOS</h3>
          <nav className="modules-nav">
            <button
              className={`module-item ${(vista === 'pacientes') ? 'active' : ''}`}
              onClick={() => setVista('pacientes')}>
              <span className="module-icon"><FiUsers /></span>
              <span className="module-name">Pacientes</span>
              <span className="module-count">{todosPacientes.length}</span>
            </button>
            <button
              className={`module-item ${(vista === 'historial' || vista === 'nueva-anotacion' || vista === 'aclaratoria') ? 'active' : ''}`}
              onClick={() => pacienteSeleccionado && setVista('historial')}>
              <span className="module-icon"><FiFileText /></span>
              <span className="module-name">Historia Clínica</span>
              <span className="module-count">{historial.length}</span>
            </button>
          </nav>
          <div className="med-sidebar-info">
            <FaStethoscope size={13} />
            <span>{usuario.nombre?.split(' ').slice(0, 3).join(' ') || 'Médico'}</span>
          </div>
        </aside>

        <main className="content-area">

          {/* ══ VISTA: DIRECTORIO DE PACIENTES ══ */}
          {vista === 'pacientes' && (
            <>
              <div className="page-header">
                <h2>Directorio de Pacientes</h2>
                <p>Seleccione un paciente para consultar su historial o registrar una nueva anotación médica</p>
              </div>

              {/* Stats */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <div className="stat-card">
                  <div className="stat-icon-box blue"><FiUsers size={22} /></div>
                  <div className="stat-value">{todosPacientes.length}</div>
                  <div className="stat-label">TOTAL PACIENTES</div>
                  <div className="stat-subtext"><span className="stat-dot" style={{ background: '#3b82f6' }} />Registrados en sistema</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-box green"><FiFileText size={22} /></div>
                  <div className="stat-value">{historial.length}</div>
                  <div className="stat-label">ANOTACIONES</div>
                  <div className="stat-subtext"><span className="stat-dot" style={{ background: '#10b981' }} />Del paciente actual</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-box orange"><FaStethoscope size={22} /></div>
                  <div className="stat-value" style={{ fontSize: '15px', paddingTop: '5px' }}>
                    {usuario.nombre?.split(' ').slice(0,3).join(' ') || 'Médico'}
                  </div>
                  <div className="stat-label">SESIÓN ACTIVA</div>
                  <div className="stat-subtext"><span className="stat-dot" style={{ background: '#f97316' }} />Doctor en turno</div>
                </div>
              </div>

              {/* Tabla pacientes */}
              <div className="directory-section">
                <h3><FiUsers className="section-icon" /> Todos los pacientes</h3>
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input type="text" placeholder="Búsqueda por nombre o identificación..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
                <div className="patient-table">
                  <table>
                    <thead>
                      <tr>
                        <th>IDENTIFICACIÓN</th>
                        <th>NOMBRE COMPLETO</th>
                        <th>GÉNERO</th>
                        <th>TIPO SANGRE</th>
                        <th>CIUDAD</th>
                        <th>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pacFiltrados.map(p => (
                        <tr key={p.documento}>
                          <td>{p.documento}</td>
                          <td>{p.nombre}</td>
                          <td>{p.genero === 'M' ? 'Masculino' : p.genero === 'F' ? 'Femenino' : 'Otro'}</td>
                          <td><span className="badge-sangre">{p.tipoSangre}</span></td>
                          <td>{p.ciudad}</td>
                          <td>
                            <div className="action-btns">
                              <button className="btn-eye" title="Ver historial" onClick={() => verHistorial(p)}>
                                <FiEye size={13} />
                              </button>
                              <button className="btn-anotar"
                                onClick={() => {
                                  setPaciente(p)
                                  setFormAnot({ tipoConsulta: '', diagnostico: '', tratamiento: '', observaciones: '', proximaCita: '' })
                                  setErrAnot({}); setIntentoAnot(false)
                                  setVista('nueva-anotacion')
                                }}>
                                <FiPlusCircle size={12} /> Anotar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pacFiltrados.length === 0 && (
                        <tr><td colSpan="6" className="no-results">No se encontraron pacientes</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ VISTA: HISTORIAL CLÍNICO ══ */}
          {vista === 'historial' && pacienteSeleccionado && (
            <>
              <div className="page-header hist-header">
                <button className="btn-back" onClick={() => setVista('pacientes')}>
                  <FiChevronLeft /> Volver
                </button>
                <div style={{ flex: 1 }}>
                  <h2>Historial Clínico</h2>
                  <p>{pacienteSeleccionado.nombre} · CC {pacienteSeleccionado.documento}</p>
                </div>
                <button className="btn-register" style={{ width: 'auto', padding: '9px 18px', marginTop: 0 }}
                  onClick={() => {
                    setFormAnot({ tipoConsulta: '', diagnostico: '', tratamiento: '', observaciones: '', proximaCita: '' })
                    setErrAnot({}); setIntentoAnot(false)
                    setVista('nueva-anotacion')
                  }}>
                  <FiPlusCircle /> Nueva anotación
                </button>
              </div>

              {/* Ficha paciente */}
              <div className="pac-info-bar">
                <div className="pac-avatar">{initiales(pacienteSeleccionado.nombre)}</div>
                <div className="pac-datos">
                  <strong>{pacienteSeleccionado.nombre}</strong>
                  <span>CC {pacienteSeleccionado.documento}</span>
                  <span>{calcEdad(pacienteSeleccionado.fechaNacimiento)}</span>
                  <span className="badge-sangre">{pacienteSeleccionado.tipoSangre}</span>
                  <span>{pacienteSeleccionado.ciudad}</span>
                </div>
              </div>

              {/* Barra de filtros */}
              <div className="filtros-bar">
                <FiFilter size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
                <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
                <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
                {(filtroTipo || filtroDesde || filtroHasta) && (
                  <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
                    <FiX size={11} /> Limpiar
                  </button>
                )}
                <span className="filtro-count">{histFiltrado.length} resultado(s)</span>
              </div>

              {/* Anotaciones */}
              {histFiltrado.length === 0 ? (
                <div className="empty-state">
                  <FiFileText size={32} />
                  <p>{filtroTipo || filtroDesde || filtroHasta
                    ? 'No se encontraron notas'
                    : 'Este paciente aún no tiene anotaciones'}</p>
                  {(filtroTipo || filtroDesde || filtroHasta) && (
                    <button className="btn-limpiar-filtros" style={{ marginTop: '10px' }} onClick={limpiarFiltros}>
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="historial-list">
                  {histFiltrado.map(a => (
                    <div key={a.anoId} className="anotacion-card">
                      <div className="ano-header">
                        <div className="ano-left">
                          <span className={`tipo-badge ${TIPO_COLOR[a.tipoConsulta]}`}>
                            {TIPO_LABEL[a.tipoConsulta]}
                          </span>
                          {a.tieneAclaratoria && (
                            <span className="acl-indicator"><FiAlertCircle size={11} /> Con aclaratoria</span>
                          )}
                        </div>
                        <div className="ano-fecha"><FiCalendar size={12} /> {fmtFecha(a.fechaConsulta)}</div>
                      </div>
                      <div className="ano-body">
                        <div className="ano-campo">
                          <span className="ano-label">Diagnóstico</span>
                          <span>{a.diagnostico}</span>
                        </div>
                        <div className="ano-campo">
                          <span className="ano-label">Tratamiento</span>
                          <span>{a.tratamiento}</span>
                        </div>
                        <div className="ano-campo">
                          <span className="ano-label">Médico</span>
                          <span>{a.medicoNombre}</span>
                        </div>
                      </div>
                      <div className="ano-footer">
                        <button className="btn-eye" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
                          onClick={() => setModalDetalle(a)}>
                          <FiEye size={12} /> Detalle
                        </button>
                        {a.tieneAclaratoria && (
                          <button className="btn-ver-acl" onClick={() => { setModalAcl(a); cargarAclaratorias(a.anoId) }}>
                            <FiAlertCircle size={12} /> Ver aclaratorias
                          </button>
                        )}
                        <button className="btn-acl"
                          onClick={() => {
                            setAnotSeleccionada(a)
                            setDescAcl(''); setErrAcl(''); setIntentoAcl(false)
                            setVista('aclaratoria')
                          }}>
                          <FiPlusCircle size={12} /> Aclaratoria
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ VISTA: NUEVA ANOTACIÓN ══ */}
          {vista === 'nueva-anotacion' && pacienteSeleccionado && (
            <>
              <div className="page-header hist-header">
                <button className="btn-back"
                  onClick={() => setVista(historial.length > 0 ? 'historial' : 'pacientes')}>
                  <FiChevronLeft /> Volver
                </button>
                <div>
                  <h2>Nueva Anotación Médica</h2>
                  <p>{pacienteSeleccionado.nombre} · CC {pacienteSeleccionado.documento}</p>
                </div>
              </div>

              <div className="form-section" style={{ maxWidth: '680px' }}>
                <h3><FiFileText className="section-icon" /> Datos de la consulta</h3>
                <form className="patient-form" onSubmit={e => { e.preventDefault(); handleGuardarAnotacion() }}>

                  <div className="form-section-label">TIPO Y DIAGNÓSTICO</div>

                  <div className="form-group">
                    <label>TIPO DE CONSULTA *</label>
                    <CampoRequerido error={errAnot.tipoConsulta}>
                      <select value={formAnot.tipoConsulta}
                        onChange={e => {
                          setFormAnot(p => ({ ...p, tipoConsulta: e.target.value }))
                          if (intentoAnot) setErrAnot(p => ({ ...p, tipoConsulta: e.target.value ? '' : 'Seleccione el tipo de consulta' }))
                        }}
                        style={inputErrStyle('tipoConsulta')}>
                        <option value="">Seleccione...</option>
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                      </select>
                    </CampoRequerido>
                  </div>

                  <div className="form-group">
                    <label>DIAGNÓSTICO * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(máx. 200 caracteres)</span></label>
                    <CampoRequerido error={errAnot.diagnostico}>
                      <textarea rows={3} maxLength={200}
                        placeholder="Describa el diagnóstico médico..."
                        value={formAnot.diagnostico}
                        onChange={e => {
                          setFormAnot(p => ({ ...p, diagnostico: e.target.value }))
                          if (intentoAnot) setErrAnot(p => ({ ...p, diagnostico: e.target.value.trim() ? '' : 'El diagnóstico es requerido' }))
                        }}
                        style={{ ...inputErrStyle('diagnostico'), resize: 'vertical' }} />
                    </CampoRequerido>
                  </div>

                  <div className="form-section-label">TRATAMIENTO Y OBSERVACIONES</div>

                  <div className="form-group">
                    <label>TRATAMIENTO * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(máx. 200 caracteres)</span></label>
                    <CampoRequerido error={errAnot.tratamiento}>
                      <textarea rows={3} maxLength={200}
                        placeholder="Indique el tratamiento a seguir..."
                        value={formAnot.tratamiento}
                        onChange={e => {
                          setFormAnot(p => ({ ...p, tratamiento: e.target.value }))
                          if (intentoAnot) setErrAnot(p => ({ ...p, tratamiento: e.target.value.trim() ? '' : 'El tratamiento es requerido' }))
                        }}
                        style={{ ...inputErrStyle('tratamiento'), resize: 'vertical' }} />
                    </CampoRequerido>
                  </div>

                  <div className="form-group">
                    <label>OBSERVACIONES * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(máx. 500 caracteres)</span></label>
                    <CampoRequerido error={errAnot.observaciones}>
                      <textarea rows={4} maxLength={500}
                        placeholder="Observaciones adicionales de la consulta..."
                        value={formAnot.observaciones}
                        onChange={e => {
                          setFormAnot(p => ({ ...p, observaciones: e.target.value }))
                          if (intentoAnot) setErrAnot(p => ({ ...p, observaciones: e.target.value.trim() ? '' : 'Las observaciones son requeridas' }))
                        }}
                        style={{ ...inputErrStyle('observaciones'), resize: 'vertical' }} />
                    </CampoRequerido>
                  </div>

                  <div className="form-section-label">PRÓXIMA CITA (OPCIONAL)</div>

                  <div className="form-group">
                    <label>FECHA Y HORA</label>
                    <input type="datetime-local"
                      value={formAnot.proximaCita}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => setFormAnot(p => ({ ...p, proximaCita: e.target.value }))} />
                  </div>

                  <div className="inmutabilidad-aviso">
                    <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Las anotaciones médicas son <strong>inmutables</strong>. Una vez registrada no puede editarse ni eliminarse. Para correcciones use notas aclaratorias.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button type="button" className="btn-cancelar"
                      onClick={() => setVista(historial.length > 0 ? 'historial' : 'pacientes')}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-register"
                      style={{ width: 'auto', padding: '10px 22px', marginTop: 0 }}
                      disabled={loading}>
                      {loading ? 'Registrando...' : <><FiCheckCircle size={14} /> Registrar anotación</>}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ══ VISTA: NOTA ACLARATORIA ══ */}
          {vista === 'aclaratoria' && anotSeleccionada && (
            <>
              <div className="page-header hist-header">
                <button className="btn-back" onClick={() => setVista('historial')}>
                  <FiChevronLeft /> Volver al historial
                </button>
                <div>
                  <h2>Crear Nota Aclaratoria</h2>
                  <p>{pacienteSeleccionado?.nombre}</p>
                </div>
              </div>

              {/* Anotación original */}
              <div className="original-card">
                <div className="original-header">
                  <span className="original-lbl">ANOTACIÓN ORIGINAL — SOLO LECTURA</span>
                  <span className={`tipo-badge ${TIPO_COLOR[anotSeleccionada.tipoConsulta]}`}>
                    {TIPO_LABEL[anotSeleccionada.tipoConsulta]}
                  </span>
                </div>
                {[
                  ['Fecha',         fmtFecha(anotSeleccionada.fechaConsulta)],
                  ['Médico',        anotSeleccionada.medicoNombre],
                  ['Diagnóstico',   anotSeleccionada.diagnostico],
                  ['Tratamiento',   anotSeleccionada.tratamiento],
                  ['Observaciones', anotSeleccionada.observaciones],
                  anotSeleccionada.proximaCita ? ['Próxima cita', fmtFecha(anotSeleccionada.proximaCita)] : null
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="original-fila">
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Form aclaratoria */}
              <div className="form-section" style={{ maxWidth: '680px' }}>
                <h3><FiAlertCircle className="section-icon" style={{ color: '#7c3aed' }} /> Nota aclaratoria</h3>
                <div className="patient-form">
                  <div className="form-section-label">DESCRIPCIÓN DE LA CORRECCIÓN</div>

                  <div className="form-group">
                    <label>CORRECCIÓN * <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(mín. 10 · máx. 500 caracteres)</span></label>
                    <CampoRequerido error={errAcl}>
                      <textarea rows={5} maxLength={500}
                        placeholder="Describa la corrección o aclaración a la anotación original..."
                        value={descAcl}
                        onChange={e => {
                          setDescAcl(e.target.value)
                          if (intentoAcl) setErrAcl(!e.target.value.trim() || e.target.value.trim().length < 10 ? 'La descripción debe tener al menos 10 caracteres' : '')
                        }}
                        style={{ ...(errAcl ? { borderColor: '#ef4444', background: '#fff5f5' } : {}), resize: 'vertical' }} />
                    </CampoRequerido>
                    <span style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>{descAcl.length}/500</span>
                  </div>

                  <div className="inmutabilidad-aviso">
                    <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>La anotación original permanecerá <strong>inalterada</strong>. Esta nota aclaratoria también será inmutable una vez creada.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button className="btn-cancelar" onClick={() => setVista('historial')}>Cancelar</button>
                    <button className="btn-register" style={{ width: 'auto', padding: '10px 22px', marginTop: 0, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                      onClick={handleGuardarAclaratoria} disabled={loading}>
                      {loading ? 'Registrando...' : <><FiCheckCircle size={14} /> Registrar aclaratoria</>}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="main-footer">
        <span>CMQ — Módulo Médico</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {fmtDateTime(currentTime)}
        </span>
      </footer>

      {/* ══ MODAL: DETALLE ANOTACIÓN ══ */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal modal-perfil" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiFileText size={18} /></div>
                <div><h3>Detalle de Anotación</h3><p>{fmtFecha(modalDetalle.fechaConsulta)}</p></div>
              </div>
              <button className="modal-close" onClick={() => setModalDetalle(null)}>✕</button>
            </div>
            <div className="modal-body perfil-body">
              <div className="perfil-seccion-titulo">INFORMACIÓN GENERAL</div>
              <div className="perfil-fila">
                <span>Tipo</span>
                <span className={`tipo-badge ${TIPO_COLOR[modalDetalle.tipoConsulta]}`}>{TIPO_LABEL[modalDetalle.tipoConsulta]}</span>
              </div>
              <div className="perfil-fila"><span>Médico</span><span>{modalDetalle.medicoNombre}</span></div>
              <div className="perfil-fila"><span>Especialidad</span><span>{modalDetalle.medicoEspecialidad}</span></div>
              <div className="perfil-fila"><span>Fecha</span><span>{fmtFecha(modalDetalle.fechaConsulta)}</span></div>
              {modalDetalle.proximaCita && (
                <div className="perfil-fila"><span>Próxima cita</span><span>{fmtFecha(modalDetalle.proximaCita)}</span></div>
              )}
              <div className="perfil-seccion-titulo">NOTAS CLÍNICAS</div>
              <div className="perfil-fila" style={{ flexDirection: 'column', gap: '3px' }}>
                <span>Diagnóstico</span><span style={{ fontWeight: 400, color: '#1e293b' }}>{modalDetalle.diagnostico}</span>
              </div>
              <div className="perfil-fila" style={{ flexDirection: 'column', gap: '3px' }}>
                <span>Tratamiento</span><span style={{ fontWeight: 400, color: '#1e293b' }}>{modalDetalle.tratamiento}</span>
              </div>
              <div className="perfil-fila" style={{ flexDirection: 'column', gap: '3px' }}>
                <span>Observaciones</span><span style={{ fontWeight: 400, color: '#1e293b' }}>{modalDetalle.observaciones}</span>
              </div>
              {modalDetalle.tieneAclaratoria && (
                <div className="acl-aviso-modal"><FiAlertCircle size={13} /> Esta anotación tiene nota(s) aclaratoria(s)</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalDetalle(null)}>Cerrar</button>
              <button className="btn-guardar btn-purple"
                onClick={() => {
                  setAnotSeleccionada(modalDetalle)
                  setDescAcl(''); setErrAcl(''); setIntentoAcl(false)
                  setModalDetalle(null); setVista('aclaratoria')
                }}>
                <FiPlusCircle size={13} /> Crear aclaratoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: VER ACLARATORIAS ══ */}
      {modalAcl && (
        <div className="modal-overlay" onClick={() => setModalAcl(null)}>
          <div className="modal modal-perfil" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box" style={{ background: '#fff7ed', color: '#c2410c' }}>
                  <FiAlertCircle size={18} />
                </div>
                <div><h3>Notas Aclaratorias</h3><p>Anotación del {fmtFecha(modalAcl.fechaConsulta)}</p></div>
              </div>
              <button className="modal-close" onClick={() => setModalAcl(null)}>✕</button>
            </div>
            <div className="modal-body perfil-body">
              {aclaratorias.length === 0
                ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Cargando...</p>
                : aclaratorias.map(ac => (
                  <div key={ac.nacId} className="acl-item">
                    <div className="acl-item-top">
                      <span className="acl-tag">Nota #{ac.nacId}</span>
                      <span className="acl-fecha">{fmtFecha(ac.fechaCreacion)}</span>
                    </div>
                    <p className="acl-desc">{ac.descripcion}</p>
                    <span className="acl-medico">Dr. {ac.medicoNombre}</span>
                  </div>
                ))
              }
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalAcl(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicoPrincipal
