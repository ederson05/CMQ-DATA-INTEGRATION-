import { useState, useEffect } from 'react'
import { FiUsers, FiCalendar, FiFileText, FiUser, FiSearch, FiEdit2, FiTrash2, FiLogOut } from 'react-icons/fi'
import { FaStethoscope } from 'react-icons/fa'
import './secretaria_principal.css'
import { useNavigate } from 'react-router-dom'


function SecretariaPrincipal() {
  const [activeModule, setActiveModule] = useState('pacientes')
   const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pacientes, setPacientes] = useState([
    { id: '10821', nombre: 'Ederson', telefono: '3214568741' },
    { id: '87026', nombre: 'Manuel', telefono: '3182456322' },
    { id: '59741', nombre: 'Meneses', telefono: '3007045896' },
    { id: '10887', nombre: 'Cristian', telefono: '3185632489' },
    { id: '9965',  nombre: 'Jhonatan Erazo', telefono: '3258963214' },
  ])
  const [busqueda, setBusqueda] = useState('')
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: '', identificacion: '', telefono: '', edad: '', genero: ''
  })

  // Reloj en tiempo real
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevoPaciente(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevo = {
      id: Math.floor(Math.random() * 90000 + 10000).toString(),
      nombre: nuevoPaciente.nombre,
      telefono: nuevoPaciente.telefono
    }
    setPacientes(prev => [...prev, nuevo])
    setNuevoPaciente({ nombre: '', identificacion: '', telefono: '', edad: '', genero: '' })
    alert('✅ Paciente registrado correctamente')
  }



  const handleEliminar = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este paciente?')) {
      setPacientes(prev => prev.filter(p => p.id !== id))
    }
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.id.includes(busqueda)
  )

  const modules = [
    { id: 'pacientes', name: 'Pacientes',      count: pacientes.length, icon: <FiUsers /> },
    { id: 'citas',     name: 'Citas Médicas',  count: 0,                icon: <FiCalendar /> },
    { id: 'historia',  name: 'Historia Clínica', count: 2,              icon: <FiFileText /> },
  ]

  const stats = [
    { label: 'TOTAL PACIENTES', value: pacientes.length, subtext: 'Registrados en sistema', color: 'blue',   icon: <FiUsers size={22} />,       dot: '#3b82f6' },
    { label: 'CITAS ACTIVAS',   value: 0,                subtext: 'Citas programadas',      color: 'green',  icon: <FiCalendar size={22} />,    dot: '#10b981' },
    { label: 'MÉDICOS',         value: 0,                subtext: 'Especialistas activos',  color: 'orange', icon: <FaStethoscope size={22} />, dot: '#f97316' },
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
                className={`module-item ${activeModule === mod.id ? 'active' : ''}`}
                onClick={() => setActiveModule(mod.id)}
              >
                <span className="module-icon">{mod.icon}</span>
                <span className="module-name">{mod.name}</span>
                <span className="module-count">{mod.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
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

          {/* Formulario + Directorio */}
          <div className="patient-sections">

            {/* Nuevo Paciente */}
            <div className="form-section">
              <h3><FiUser className="section-icon" /> Nuevo Paciente</h3>
              <form onSubmit={handleSubmit} className="patient-form">
                <div className="form-group">
                  <label>NOMBRE COMPLETO</label>
                  <input
                    type="text" name="nombre"
                    placeholder="Ej. Juan Pérez García"
                    value={nuevoPaciente.nombre}
                    onChange={handleInputChange} required
                  />
                </div>
                <div className="form-group">
                  <label>IDENTIFICACIÓN</label>
                  <input
                    type="text" name="identificacion"
                    placeholder="Ej. 87526984"
                    value={nuevoPaciente.identificacion}
                    onChange={handleInputChange} required
                  />
                </div>
                <div className="form-group">
                  <label>TELÉFONO</label>
                  <input
                    type="tel" name="telefono"
                    placeholder="Ej. 3214556879"
                    value={nuevoPaciente.telefono}
                    onChange={handleInputChange} required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>EDAD (AÑOS)</label>
                    <input
                      type="number" name="edad"
                      placeholder="0"
                      value={nuevoPaciente.edad}
                      onChange={handleInputChange} required
                    />
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
                <button type="submit" className="btn-register">
                  <FiUser /> Registrar paciente
                </button>
              </form>
            </div>

            {/* Directorio */}
            <div className="directory-section">
              <h3><FiUsers className="section-icon" /> Directorio de Pacientes</h3>
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Búsqueda por nombre o ID..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
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
                            <button className="btn-edit"><FiEdit2 size={12} /> Editar</button>
                            <button className="btn-delete" onClick={() => handleEliminar(p.id)}>
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pacientesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-results">No se encontraron pacientes</td>
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

    </div>
  )
}

export default SecretariaPrincipal