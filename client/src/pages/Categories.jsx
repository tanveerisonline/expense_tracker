import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import CategoryForm from '../components/CategoryForm'

export default function Categories() {
  const { csrfToken } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    const { data } = await api.get('/categories')
    setCategories(data.categories)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const createCategory = async (payload) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/categories', payload, { headers: { 'X-CSRF-Token': csrfToken } })
      await loadCategories()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id) => {
    setError('')
    const ok = window.confirm('Delete this category? This cannot be undone.')
    if (!ok) return
    try {
      await api.delete(`/categories/${id}`, { headers: { 'X-CSRF-Token': csrfToken } })
      await loadCategories()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete category')
    }
  }

  return (
    <div>
      <CategoryForm onSubmit={createCategory} loading={loading} />
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card card-body">
        <h5 className="card-title">Your Categories</h5>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fields</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted">No categories yet. Create one above.</td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{(c.fields || []).map((f) => f.label).join(', ')}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCategory(c._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}