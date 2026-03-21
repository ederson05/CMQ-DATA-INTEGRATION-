import { useState, useEffect } from 'react'
import {
  FiUsers, FiCalendar, FiFileText, FiUser,
  FiSearch, FiEdit2, FiLogOut, FiEye
} from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import './secretaria_principal.css'

function SecretariaPrincipal() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pacienteEditando, setPacienteEditando] = useState(null)
  const [pacienteViendo, setPacienteViendo] = useState(null)

  const [pacientes, setPacientes] = useState([
    {
      id: '10821', nombre: 'Ederson García', telefono: '3214568741',
      fechaNacimiento: '1995-06-15', genero: 'M', tipoSangre: 'O+',
      email: 'ederson@email.com', direccion: 'Calle 5 # 10-20', ciudad: 'Popayán',
      contactoEmergenciaNombre: 'Carlos García', contactoEmergenciaTel: '3101234567'
    },
    {
      id: '87026', nombre: 'Manuel Torres', telefono: '3182456322',
      fechaNacimiento: '1988-03-22', genero: 'M', tipoSangre: 'A+',
      email: 'manuel@email.com', direccion: 'Carrera 8 # 3-45', ciudad: 'Popayán',
      contactoEmergenciaNombre: 'Ana Torres', contactoEmergenciaTel: '3209876543'
    },
    {
      id: '59741', nombre: 'Meneses Ruiz', telefono: '3007045896',
      fechaNacimiento: '2000-11-10', genero: 'M', tipoSangre: 'B-',
      email: 'meneses@email.com', direccion: 'Av 4 Norte # 12-30', ciudad: 'Cali',
      contactoEmergenciaNombre: 'Rosa Ruiz', contactoEmergenciaTel: '3154567890'
    },
    {
      id: '10887', nombre: 'Cristian López', telefono: '3185632489',
      fechaNacimiento: '1992-07-08', genero: 'M', tipoSangre: 'AB+',
      email: 'cristian@email.com', direccion: 'Calle 15 # 8-60', ciudad: 'Bogotá',
      contactoEmergenciaNombre: 'María López', contactoEmergenciaTel: '3187654321'
    },
    {
      id: '9965', nombre: 'Jhonatan Erazo', telefono: '3258963214',
      fechaNacimiento: '1997-01-25', genero: 'M', tipoSangre: 'O-',
      email: 'jhonatan@email.com', direccion: 'Cra 3 # 20-15', ciudad: 'Pasto',
      contactoEmergenciaNombre: 'Luis Erazo', contactoEmergenciaTel: '3223456789'
    },
  ])

  const [busqueda, setBusqueda] = useState('')
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: '', id: '', telefono: '', fechaNacimiento: '', genero: '',
    tipoSangre: '', email: '', direccion: '', ciudad: '',
    contactoEmergenciaNombre: '', contactoEmergenciaTel: ''
  })

  // ⏰ Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => date.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const formatTime = (date) => date.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-'
    const hoy = new Date()
    const nac = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return `${edad} años`
  }

  const formatGenero = (g) => {
    if (g === 'M') return 'Masculino'
    if (g === 'F') return 'Femenino'
    if (g === 'O') return 'Otro'
    return '-'
  }

  // Handlers nuevo paciente
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoPaciente(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nuevoPaciente.id.trim()) {
      alert('⚠️ Por favor ingresa el número de identificación')
      return
    }
    if (pacientes.find(p => p.id === nuevoPaciente.id.trim())) {
      alert('⚠️ Ya existe un paciente con esa identificación')
      return
    }
    setPacientes(prev => [...prev, { ...nuevoPaciente, id: nuevoPaciente.id.trim() }])
    setNuevoPaciente({
      nombre: '', id: '', telefono: '', fechaNacimiento: '', genero: '',
      tipoSangre: '', email: '', direccion: '', ciudad: '',
      contactoEmergenciaNombre: '', contactoEmergenciaTel: ''
    })
    alert('✅ Paciente registrado correctamente')
  }

  // Handlers editar
  const handleEditar = (p) => setPacienteEditando({ ...p })
  const handleGuardarEdicion = () => {
    const original = pacientes.find(p => p.id === pacienteEditando.id)
    const sinCambios =
      pacienteEditando.nombre.trim() === original.nombre.trim() &&
      pacienteEditando.telefono.trim() === original.telefono.trim() &&
      pacienteEditando.email.trim() === original.email.trim() &&
      pacienteEditando.direccion.trim() === original.direccion.trim() &&
      pacienteEditando.ciudad.trim() === original.ciudad.trim() &&
      pacienteEditando.contactoEmergenciaNombre.trim() === original.contactoEmergenciaNombre.trim() &&
      pacienteEditando.contactoEmergenciaTel.trim() === original.contactoEmergenciaTel.trim()

    if (sinCambios) {
      alert('⚠️ No se modificaron datos')
      return
    }
    setPacientes(prev => prev.map(p => p.id === pacienteEditando.id ? pacienteEditando : p))
    setPacienteEditando(null)
    alert('✅ Modificación exitosa')
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.id.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',        count: pacientes.length, icon: <FiUsers />,    path: '/secretaria' },
    { id: 'citas',     name: 'Citas Médicas',    count: 0,                icon: <FiCalendar />, path: '/citas' },
    { id: 'historia',  name: 'Historia Clínica', count: 2,                icon: <FiFileText />, path: '/historia' },
  ]

  const stats = [
    { label: 'TOTAL PACIENTES', value: pacientes.length, subtext: 'Registrados en sistema', color: 'blue',   icon: <FiUsers size={22} />,       dot: '#3b82f6' },
    { label: 'CITAS ACTIVAS',   value: 0,                subtext: 'Citas programadas',      color: 'green',  icon: <FiCalendar size={22} />,    dot: '#10b981' },
    { label: 'MÉDICOS',         value: 5,                subtext: 'Especialistas activos',  color: 'orange', icon: <FaStethoscope size={22} />, dot: '#f97316' },
    { label: 'HISTORIALES',     value: 2,                subtext: 'Registros clínicos',     color: 'purple', icon: <FiFileText size={22} />,    dot: '#8b5cf6' },
  ]

  return (
    <div className="secretaria-container">

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
                className={`module-item ${mod.id === 'pacientes' ? 'active' : ''}`}
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
            <h2>Gestión de Pacientes</h2>
            <p>Registro, consulta y actualización de pacientes del sistema</p>
          </div>

          {/* Stats */}
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

          <div className="patient-sections">

            {/* ── NUEVO PACIENTE ── */}
            <div className="form-section">
              <h3><FiUser className="section-icon" /> Nuevo Paciente</h3>
              <form onSubmit={handleSubmit} className="patient-form">

                <div className="form-section-label">IDENTIFICACIÓN</div>
                <div className="form-group">
                  <label>NÚMERO DE IDENTIFICACIÓN</label>
                  <input type="text" name="id" placeholder="Ej. 1062554433"
                    value={nuevoPaciente.id} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>NOMBRE COMPLETO</label>
                  <input type="text" name="nombre" placeholder="Ej. Laura Grijalba Mena"
                    value={nuevoPaciente.nombre} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>FECHA DE NACIMIENTO</label>
                    <input type="date" name="fechaNacimiento"
                      value={nuevoPaciente.fechaNacimiento} onChange={handleInputChange} required />
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
                    value={nuevoPaciente.telefono} onChange={handleInputChange} required />
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
                  <label>NOMBRE</label>
                  <input type="text" name="contactoEmergenciaNombre" placeholder="Ej. Pedro Grijalba"
                    value={nuevoPaciente.contactoEmergenciaNombre} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>TELÉFONO</label>
                  <input type="tel" name="contactoEmergenciaTel" placeholder="Ej. 3119900112"
                    value={nuevoPaciente.contactoEmergenciaTel} onChange={handleInputChange} />
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
                <input type="text" placeholder="Búsqueda por nombre o ID..."
                  value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className="patient-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>NOMBRE</th>
                      <th>TELÉFONO</th>
                      <th>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.nombre}</td>
                        <td>{p.telefono}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-eye" title="Ver perfil"
                              onClick={() => setPacienteViendo(p)}>
                              <FiEye size={13} />
                            </button>
                            <button className="btn-edit" onClick={() => handleEditar(p)}>
                              <FiEdit2 size={12} /> Editar
                            </button>
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

      {/* ── FOOTER ── */}
      <footer className="main-footer">
        <span>CMQ - Módulo Clínica</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {formatTime(currentTime)}
        </span>
      </footer>

      {/* ══════════════════════════════
          MODAL VER PERFIL
      ══════════════════════════════ */}
      {pacienteViendo && (
        <div className="modal-overlay" onClick={() => setPacienteViendo(null)}>
          <div className="modal modal-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiUser size={18} /></div>
                <div>
                  <h3>Perfil del Paciente</h3>
                  <p>{pacienteViendo.nombre}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setPacienteViendo(null)}>✕</button>
            </div>

            <div className="modal-body perfil-body">

              <div className="perfil-seccion-titulo">IDENTIFICACIÓN</div>
              <div className="perfil-fila"><span>Número ID</span><span>CC {pacienteViendo.id}</span></div>
              <div className="perfil-fila"><span>Nombre Completo</span><span>{pacienteViendo.nombre}</span></div>
              <div className="perfil-fila"><span>Fecha de Nacimiento</span>
                <span>{pacienteViendo.fechaNacimiento
                  ? new Date(pacienteViendo.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-CO')
                  : '-'}</span>
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
              <button className="btn-guardar" onClick={() => {
                setPacienteViendo(null)
                handleEditar(pacienteViendo)
              }}>
                <FiEdit2 size={13} /> Editar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL EDITAR PACIENTE
      ══════════════════════════════ */}
      {pacienteEditando && (
        <div className="modal-overlay" onClick={() => setPacienteEditando(null)}>
          <div className="modal modal-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box"><FiUser size={18} /></div>
                <div>
                  <h3>Editar Paciente</h3>
                  <p>Modifica la información del paciente</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setPacienteEditando(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>ID DEL PACIENTE</label>
                <input type="text" value={pacienteEditando.id} disabled />
              </div>
              <div className="form-group">
                <label>NOMBRE COMPLETO</label>
                <input type="text" value={pacienteEditando.nombre}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>TELÉFONO</label>
                <input type="tel" value={pacienteEditando.telefono}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, telefono: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>EMAIL</label>
                <input type="email" value={pacienteEditando.email}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>DIRECCIÓN</label>
                <input type="text" value={pacienteEditando.direccion}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, direccion: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>CIUDAD</label>
                <input type="text" value={pacienteEditando.ciudad}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, ciudad: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>CONTACTO EMERGENCIA — NOMBRE</label>
                <input type="text" value={pacienteEditando.contactoEmergenciaNombre}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, contactoEmergenciaNombre: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>CONTACTO EMERGENCIA — TELÉFONO</label>
                <input type="tel" value={pacienteEditando.contactoEmergenciaTel}
                  onChange={(e) => setPacienteEditando(prev => ({ ...prev, contactoEmergenciaTel: e.target.value }))} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setPacienteEditando(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={handleGuardarEdicion}>
                <FiEdit2 size={13} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SecretariaPrincipal