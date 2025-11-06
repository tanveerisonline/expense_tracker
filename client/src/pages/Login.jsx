import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateEmail(email)) return setError('Please enter a valid email.')
    if (!validatePassword(password)) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = email && !validateEmail(email)
  const passwordInvalid = password && !validatePassword(password)

  return (
    <section className="min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow rounded-4">
              <div className="card-body p-4 p-md-5">
                <h2 className="mb-1">Welcome back</h2>
                <p className="text-muted mb-4">Please sign in to continue</p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={onSubmit} noValidate>
                  <div className="form-floating mb-3">
                    <input
                      id="email"
                      type="email"
                      className={`form-control ${emailInvalid ? 'is-invalid' : ''}`}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="email">Email address</label>
                    {emailInvalid && <div className="invalid-feedback">Enter a valid email.</div>}
                  </div>

                  <div className="mb-3">
                    <div className="input-group">
                      <div className="form-floating">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control ${passwordInvalid ? 'is-invalid' : ''}`}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        />
                        <label htmlFor="password">Password</label>
                        {passwordInvalid && <div className="invalid-feedback">Minimum 6 characters.</div>}
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="remember" />
                      <label className="form-check-label" htmlFor="remember">Remember me</label>
                    </div>
                    <Link to="/signup" className="text-decoration-none">Create account</Link>
                  </div>

                  <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>

              </div>
            </div>
            <p className="text-center text-muted mt-3">Secure login with JWT & CSRF protection</p>
          </div>
        </div>
      </div>
    </section>
  )
}