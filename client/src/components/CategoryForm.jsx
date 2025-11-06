import { useEffect, useRef, useState } from 'react'

export default function CategoryForm({ onSubmit, loading, initialCategory = null, onCancel }) {
  const [name, setName] = useState('')
  const [fields, setFields] = useState([])
  const [error, setError] = useState('')
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '')
      setFields(initialCategory.fields || [])
      // Focus and select the Category Name when editing starts
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus()
          nameInputRef.current.select()
        }
      }, 0)
    } else {
      setName('')
      setFields([])
    }
  }, [initialCategory])

  // Removed Add Field functionality — preserve existing fields on edit but don't render controls

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Category name is required.')
    await onSubmit({ name: name.trim(), fields })
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
          <input ref={nameInputRef} type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 d-flex d-md-inline-flex gap-2">
        <button className="btn btn-success btn-sm" type="submit" disabled={loading}>{loading ? 'Saving...' : initialCategory ? 'Update' : 'Create'}</button>
        {initialCategory && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  )
}