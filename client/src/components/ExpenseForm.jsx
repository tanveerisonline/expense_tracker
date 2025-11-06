import { useEffect, useState } from 'react'
import { validateAmount } from '../utils/validation'

export default function ExpenseForm({ categories, selectedCategoryId, onSubmit, editingExpense, loading }) {
  const [categoryId, setCategoryId] = useState(selectedCategoryId || '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [customValues, setCustomValues] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    setCategoryId(selectedCategoryId || '')
  }, [selectedCategoryId])

  useEffect(() => {
    if (editingExpense) {
      setCategoryId(editingExpense.category?._id || editingExpense.categoryId)
      setAmount(String(editingExpense.amount))
      setDate(editingExpense.date?.slice(0, 10) || '')
      setDescription(editingExpense.description || '')
      setCustomValues(editingExpense.customFields || {})
    } else {
      setAmount('')
      setDate('')
      setDescription('')
      setCustomValues({})
    }
  }, [editingExpense])

  const currentCategory = categories.find((c) => c._id === categoryId)

  const handleCustomChange = (key, value) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!categoryId) return setError('Please select a category.')
    if (!validateAmount(amount)) return setError('Enter a valid amount greater than 0.')
    if (!date) return setError('Please select a date.')
    await onSubmit({ categoryId, amount: Number(amount), date, description, customFields: customValues })
    setAmount('')
    setDate('')
    setDescription('')
    setCustomValues({})
  }

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-4">
      <h5 className="card-title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label">Category</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Amount</label>
          <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Description</label>
          <input type="text" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      {currentCategory?.fields?.length ? (
        <div className="row g-3 mt-2">
          {currentCategory.fields.map((f) => (
            <div className="col-md-3" key={f.key}>
              <label className="form-label">{f.label}</label>
              {f.type === 'text' && (
                <input type="text" className="form-control" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)} />
              )}
              {f.type === 'number' && (
                <input type="number" className="form-control" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)} />
              )}
              {f.type === 'date' && (
                <input type="date" className="form-control" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)} />
              )}
              {f.type === 'boolean' && (
                <select className="form-select" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              )}
              {f.type === 'select' && (
                <select className="form-select" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)}>
                  <option value="">Select</option>
                  {(f.options || []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-3">
        <button className="btn btn-success" type="submit" disabled={loading}>{loading ? 'Saving...' : editingExpense ? 'Update' : 'Add'}</button>
      </div>
    </form>
  )
}