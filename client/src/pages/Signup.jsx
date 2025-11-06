import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required.')
    if (!validateEmail(email)) return setError('Please enter a valid email.')
    if (!validatePassword(password)) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="card-title mb-4">Signup</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Signup'}</button>
              <p className="mt-3">Already have an account? <Link to="/login">Login</Link></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}