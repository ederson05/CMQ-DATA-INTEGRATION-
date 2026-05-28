import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'

const API = 'https://cmq-backend.onrender.com/api'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  // ✅ Si ya hay sesión activa, redirige sin borrar nada
  useEffect(() => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      if (usuario?.rol) {
        const rol = usuario.rol.toUpperCase()
        if (rol === 'MEDICO') navigate('/medico', { replace: true })
        else if (rol === 'ENFERMERO') navigate('/enfermero', { replace: true })
        else if (rol === 'SECRETARIA') navigate('/secretaria', { replace: true })
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err)
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success && data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        const rol = data.usuario.rol?.toUpperCase()

        if (rol === 'MEDICO') {
          navigate('/medico', { replace: true })
        } else if (rol === 'ENFERMERO') {
          navigate('/enfermero', { replace: true })
        } else if (rol === 'SECRETARIA') {
          navigate('/secretaria', { replace: true })
        } else {
          setErrorMsg('Rol no reconocido')
        }
      } else {
        setErrorMsg(data.mensaje || 'Email o contraseña incorrectos')
      }
    } catch (err) {
      console.error('Error de login:', err)
      setErrorMsg('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
          <h1>Hospital CMQ</h1>
          <p>Sistema de Información Clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMsg('')
              }}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrorMsg('')
              }}
              disabled={loading}
              required
            />
          </div>

          {errorMsg && (
            <div className="login-error">
              <span className="login-error-icon">!</span>
              {errorMsg}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-hints">
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>CREDENCIALES DE PRUEBA</h4>
          
          <div className="hint-item">
            <span className="hint-label">Secretaria:</span>
            <code>laura.garcia@cmq.com</code>
            <code style={{ marginLeft: '8px' }}>secretaria123</code>
          </div>

          <div className="hint-item">
            <span className="hint-label">Médico:</span>
            <code>c.mendoza@cmq.com</code>
            <code style={{ marginLeft: '8px' }}>medico123</code>
          </div>

          <div className="hint-item">
            <span className="hint-label">Enfermero:</span>
            <code>camilo@gmail.com</code>
            <code style={{ marginLeft: '8px' }}>enfermero123</code>
          </div>
        </div>

        <div className="login-footer">
          <small>© 2025 Hospital CMQ — v2.41 Grace OS</small>
        </div>
      </div>
    </div>
  )
}

export default Login