import { useEffect, useRef, useState } from 'react'
import { validateAmount } from '../utils/validation'

export default function ExpenseForm({ categories, onSubmit, editingExpense, loading }) {
  const [categoryId, setCategoryId] = useState('')
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [customValues, setCustomValues] = useState({})
  const [error, setError] = useState('')
  const amountInputRef = useRef(null)

  // Decoupled: changing the list's selectedCategoryId no longer updates the form's category

  useEffect(() => {
    if (editingExpense) {
      setCategoryId(editingExpense.category?._id || editingExpense.categoryId)
      setItemName(editingExpense.itemName || '')
      setAmount(String(editingExpense.amount))
      setDate(editingExpense.date?.slice(0, 10) || '')
      setDescription(editingExpense.description || '')
      setCustomValues(editingExpense.customFields || {})
      // Focus and select the Amount field when edit starts
      setTimeout(() => {
        if (amountInputRef.current) {
          amountInputRef.current.focus()
          amountInputRef.current.select()
        }
      }, 0)
    } else {
      setAmount('')
      setDate('')
      setDescription('')
      setItemName('')
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
    await onSubmit({ categoryId, itemName, amount: Number(amount), date, description, customFields: customValues })
    setAmount('')
    setDate('')
    setDescription('')
    setItemName('')
    setCustomValues({})
  }

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
        <h5 className="card-title" style={{ marginBottom: '2.2rem' }}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h5>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <label className="form-label">Item Name</label>
          <input type="text" className="form-control" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label className="form-label">Amount</label>
          <input ref={amountInputRef} type="number" inputMode="decimal" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="1" required placeholder="0" />
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            onFocus={(e) => { try { e.target.showPicker && e.target.showPicker() } catch { /* showPicker not supported */ } }}
            onMouseDown={(e) => { try { if (e.target.showPicker) { e.preventDefault(); e.target.showPicker() } } catch { /* showPicker not supported */ } }}
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <label className="form-label">Description</label>
          <input type="text" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
        </div>
        <div className="col-12 col-md-6 col-lg-2">
          <label className="form-label">Category</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
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
                <input type="number" className="form-control" value={customValues[f.key] || ''} onChange={(e) => handleCustomChange(f.key, e.target.value)} placeholder="0" />
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
      <div className="mt-3 d-flex d-md-inline-flex gap-2">
        <button className="btn btn-success btn-sm" type="submit" disabled={loading}>{loading ? 'Saving...' : editingExpense ? 'Update' : 'Add'}</button>
        {editingExpense && (
          <button type="button" className="btn btn-secondary btn-sm flex-fill flex-md-grow-0" onClick={() => {
            setAmount('')
            setDate('')
            setDescription('')
            setItemName('')
            setCustomValues({})
          }}>Cancel</button>
        )}
      </div>
    </form>
  )
}