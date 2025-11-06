import { useEffect, useState } from 'react'

export default function CategoryForm({ onSubmit, loading, initialCategory = null, onCancel }) {
  const [name, setName] = useState('')
  const [fields, setFields] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '')
      setFields(initialCategory.fields || [])
    } else {
      setName('')
      setFields([])
    }
  }, [initialCategory])

  const addField = () => {
    setFields((prev) => [...prev, { key: '', label: '', type: 'text', options: [] }])
  }

  const updateField = (index, updated) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updated } : f)))
  }

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Category name is required.')
    const cleaned = fields.map((f) => ({
      key: f.key.trim() || f.label.trim().toLowerCase().replace(/\s+/g, '_'),
      label: f.label.trim(),
      type: f.type,
      options: f.type === 'select' ? (f.options || []).filter(Boolean) : [],
    }))
    await onSubmit({ name: name.trim(), fields: cleaned })
    setName('')
    setFields([])
  }

  return (
    <form onSubmit={handleSubmit} className="card card-body mb-4">
      <h5 className="card-title">{initialCategory ? 'Edit Category' : 'Create Category'}</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Category Name</label>
          <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <button type="button" className="btn btn-info" onClick={addField}>Add Field</button>
        </div>
      </div>

      {fields.map((f, i) => (
        <div className="row g-3 mt-2" key={i}>
          <div className="col-md-3">
            <label className="form-label">Label</label>
            <input type="text" className="form-control" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Key</label>
            <input type="text" className="form-control" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Type</label>
            <select className="form-select" value={f.type} onChange={(e) => updateField(i, { type: e.target.value })}>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
            </select>
          </div>
          {f.type === 'select' && (
            <div className="col-md-3">
              <label className="form-label">Options (comma separated)</label>
              <input type="text" className="form-control" value={f.options?.join(',') || ''} onChange={(e) => updateField(i, { options: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} />
            </div>
          )}
          <div className="col-md-2 d-flex align-items-end">
            <button type="button" className="btn btn-danger" onClick={() => removeField(i)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="mt-3 d-flex d-md-inline-flex w-100 gap-2">
        <button className="btn btn-success flex-fill" type="submit" disabled={loading}>{loading ? 'Saving...' : initialCategory ? 'Update' : 'Create'}</button>
        {initialCategory && (
          <button type="button" className="btn btn-secondary flex-fill flex-md-grow-0" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  )
}