import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'

//const API = 'http://localhost:3001/api'   // local
const API = 'https://cmq-backend.onrender.com/api' // producción

function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  // ── Limpia la sesión cada vez que se monta el Login ──
  // Así si el usuario da "atrás" desde secretaria/médico,
  // la sesión muere y tiene que volver a autenticarse
  useEffect(() => {
    localStorage.removeItem('usuario')
  }, [])

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

      if (data.success) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        const rol = data.usuario.rol?.toUpperCase()
        // replace:true evita que /login quede en el historial del navegador
        if (rol === 'MEDICO') {
          navigate('/medico', { replace: true })
        } else {
          navigate('/secretaria', { replace: true })
        }
      } else {
        setErrorMsg('Email o contraseña incorrectos')
      }
    } catch (err) {
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
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1>Centro Médico</h1>
          <p>Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
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
              onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
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
          <p>Secretaria: <code>laura.garcia@cmq.com</code></p>
          <p>Médico: <code>c.mendoza@cmq.com</code></p>
          <p>Contraseña médico: <code>medico123</code> · secretaria: <code>secretaria123</code></p>
        </div>
      </div>
    </div>
  )
}

export default Login