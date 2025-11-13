import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function BulkDelete() {
  const { csrfToken } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  // Bulk delete state
  const [deleteCategoryId, setDeleteCategoryId] = useState('')
  const [deleteMode, setDeleteMode] = useState('range') // 'range' | 'days'
  const [deleteFrom, setDeleteFrom] = useState('')
  const [deleteTo, setDeleteTo] = useState('')
  const [deleteDays, setDeleteDays] = useState(7)
  const [deleteResult, setDeleteResult] = useState(null)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    const { data } = await api.get('/categories')
    setCategories(data.categories)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const bulkDelete = async () => {
    setError('')
    if (!deleteCategoryId) {
      setError('Please select a category.')
      return
    }
    const confirmMsg =
      deleteMode === 'days'
        ? `Delete last ${deleteDays} day(s) of records for the selected category?`
        : `Delete records from ${deleteFrom || 'start'} to ${deleteTo || 'end'} for the selected category?`
    if (!window.confirm(confirmMsg)) return
    const payload = { categoryId: deleteCategoryId }
    if (deleteMode === 'days') payload.days = Number(deleteDays)
    else {
      payload.from = deleteFrom
      payload.to = deleteTo
    }
    setLoading(true)
    try {
      const { data } = await api.post('/expenses/bulk-delete', payload, { headers: { 'X-CSRF-Token': csrfToken } })
      setDeleteResult(data.deleted)
    } catch (e) {
      setError(e?.response?.data?.message || 'Bulk delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-body">
      <h5 className="card-title">Bulk Delete (by Category)</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4">
          <label className="form-label">Category</label>
          <select className="form-select" value={deleteCategoryId} onChange={(e) => setDeleteCategoryId(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-8">
          <div className="d-flex gap-3 flex-wrap">
            <div className="form-check">
              <input className="form-check-input" type="radio" id="modeRange" name="delMode" checked={deleteMode === 'range'} onChange={() => setDeleteMode('range')} />
              <label className="form-check-label" htmlFor="modeRange">Date range</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" id="modeDays" name="delMode" checked={deleteMode === 'days'} onChange={() => setDeleteMode('days')} />
              <label className="form-check-label" htmlFor="modeDays">Last N days</label>
            </div>
          </div>
          {deleteMode === 'range' ? (
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-4">
                <label className="form-label">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={deleteFrom}
                  onChange={(e) => setDeleteFrom(e.target.value)}
                  onFocus={(e) => { try { e.target.showPicker && e.target.showPicker() } catch { /* showPicker not supported */ } }}
                  onMouseDown={(e) => { try { if (e.target.showPicker) { e.preventDefault(); e.target.showPicker() } } catch { /* showPicker not supported */ } }}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={deleteTo}
                  onChange={(e) => setDeleteTo(e.target.value)}
                  onFocus={(e) => { try { e.target.showPicker && e.target.showPicker() } catch { /* showPicker not supported */ } }}
                  onMouseDown={(e) => { try { if (e.target.showPicker) { e.preventDefault(); e.target.showPicker() } } catch { /* showPicker not supported */ } }}
                />
              </div>
              <div className="col-12 col-md-4 d-flex align-items-end">
                <button className="btn btn-danger w-100" onClick={bulkDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete Records'}</button>
              </div>
            </div>
          ) : (
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-4">
                <label className="form-label">Days</label>
                <input type="number" min="1" className="form-control" value={deleteDays} onChange={(e) => setDeleteDays(e.target.value)} />
              </div>
              <div className="col-12 col-md-4 d-flex align-items-end">
                <button className="btn btn-danger w-100" onClick={bulkDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete Records'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {deleteResult !== null && (
        <div className="alert alert-warning mt-3">Deleted {deleteResult} record(s).</div>
      )}
    </div>
  )
}