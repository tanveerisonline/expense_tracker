import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseTable from '../components/ExpenseTable'
import ChartSection from '../components/ChartSection'

const PREDEFINED_CATEGORIES = [
  'Home Vegetables','School Fee','Ahad Bhaijan','Tuition Fee','Medicines','Bus Fare','Pocket Money','Guest','Rice','Petrol','Dr Ashraf','Khuj Wali','Electricity','Clothes','Charges','Gas','Kids','Doctor','Other'
]

export default function Home() {
  const { csrfToken } = useAuth()
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [expenses, setExpenses] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [statsCategory, setStatsCategory] = useState([])
  const [statsDaily, setStatsDaily] = useState([])

  // Seed default categories for the user if missing
  const seedDefaults = async () => {
    try {
      await api.post('/categories/seed-default', { names: PREDEFINED_CATEGORIES }, { headers: { 'X-CSRF-Token': csrfToken } })
    } catch (e) {}
  }

  const loadCategories = async () => {
    const { data } = await api.get('/categories')
    setCategories(data.categories)
  }

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', limit)
      params.set('sort', `${sort.key}:${sort.direction}`)
      if (selectedCategoryId) params.set('category', selectedCategoryId)
      if (search) params.set('search', search)
      const { data } = await api.get(`/expenses?${params.toString()}`)
      setExpenses(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const { data } = await api.get('/stats/summary')
    setStatsCategory(data.byCategory)
    setStatsDaily(data.byDate)
  }

  useEffect(() => {
    seedDefaults().then(() => loadCategories())
  }, [])

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [page, limit, selectedCategoryId, search, sort])

  const handleAddOrUpdate = async (payload) => {
    if (editing) {
      await api.put(`/expenses/${editing._id}`, payload, { headers: { 'X-CSRF-Token': csrfToken } })
      setEditing(null)
    } else {
      await api.post('/expenses', payload, { headers: { 'X-CSRF-Token': csrfToken } })
    }
    await loadExpenses()
    await loadStats()
  }

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`, { headers: { 'X-CSRF-Token': csrfToken } })
    await loadExpenses()
    await loadStats()
  }

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (selectedCategoryId) params.set('category', selectedCategoryId)
    if (search) params.set('search', search)
    window.location.href = `/api/expenses/export/csv?${params.toString()}`
  }

  const exportPdf = () => {
    const params = new URLSearchParams()
    if (selectedCategoryId) params.set('category', selectedCategoryId)
    if (search) params.set('search', search)
    window.location.href = `/api/expenses/export/pdf?${params.toString()}`
  }

  return (
    <div>
      <div className="row g-3 align-items-end">
        <div className="col-md-4">
          <label className="form-label">Search</label>
          <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description or amount" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Category</label>
          <select className="form-select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Page Size</label>
          <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[10,20,50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="col-md-2 d-flex gap-2">
          <button className="btn btn-outline-secondary mt-auto" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-outline-secondary mt-auto" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      <ExpenseForm
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSubmit={handleAddOrUpdate}
        editingExpense={editing}
        loading={loading}
      />

      <div className="card card-body">
        <h5 className="card-title">Expenses</h5>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <ExpenseTable expenses={expenses} onEdit={setEditing} onDelete={handleDelete} sort={sort} setSort={setSort} />
            <nav>
              <ul className="pagination">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                </li>
                {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                  <li className={`page-item ${page === p ? 'active' : ''}`} key={p}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= pages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </>
        )}
      </div>

      <ChartSection byCategory={statsCategory} byDate={statsDaily} />
    </div>
  )
}