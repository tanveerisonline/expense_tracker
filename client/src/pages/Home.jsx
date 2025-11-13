import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseTable from '../components/ExpenseTable'
// Charts removed

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
  const formRef = useRef(null)
  // Payments summary for selected category
  const [summaryInfo, setSummaryInfo] = useState(null)
  // Charts removed: stats state eliminated

  // Seed default categories for the user if missing
  const seedDefaults = useCallback(async () => {
    try {
      await api.post('/categories/seed-default', { names: PREDEFINED_CATEGORIES }, { headers: { 'X-CSRF-Token': csrfToken } })
    } catch {
      // Seed failure is non-critical
    }
  }, [csrfToken])

  const loadCategories = useCallback(async () => {
    const { data } = await api.get('/categories')
    setCategories(data.categories)
  }, [])

  const loadExpenses = useCallback(async () => {
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
      // Load payments summary for the selected category to show Amount Paid and Balance
      if (selectedCategoryId) {
        try {
          const { data: ps } = await api.get(`/payments/summary?categoryId=${selectedCategoryId}`)
          const s = ps.summary?.[0]
          const latestPaymentDate = ps.payments?.[0]?.date || null
          if (s) {
            setSummaryInfo({
              paidTotal: s.totalPaid || 0,
              paidDate: latestPaymentDate,
              balanceLeft: Math.max(0, (s.totalExpenses || 0) - (s.totalPaid || 0)),
              balanceDate: new Date().toISOString(),
            })
          } else {
            setSummaryInfo({ paidTotal: 0, paidDate: null, balanceLeft: 0, balanceDate: new Date().toISOString() })
          }
        } catch {
          setSummaryInfo(null)
        }
      } else {
        setSummaryInfo(null)
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit, sort, selectedCategoryId, search])

  // Charts removed: loadStats eliminated

  useEffect(() => {
    seedDefaults().then(() => loadCategories())
  }, [seedDefaults, loadCategories])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  // Listen for payments updates (from Payments page) to refresh totals/balances instantly
  useEffect(() => {
    const handler = (evt) => {
      const cid = evt?.detail?.categoryId
      // Refresh only if the event relates to the currently selected category
      if (!cid || cid === selectedCategoryId) {
        loadExpenses()
      }
    }
    window.addEventListener('payments-updated', handler)
    return () => window.removeEventListener('payments-updated', handler)
  }, [selectedCategoryId, loadExpenses])

  const handleAddOrUpdate = async (payload) => {
    if (editing) {
      await api.put(`/expenses/${editing._id}`, payload, { headers: { 'X-CSRF-Token': csrfToken } })
      setEditing(null)
    } else {
      await api.post('/expenses', payload, { headers: { 'X-CSRF-Token': csrfToken } })
    }
    await loadExpenses()
  }

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`, { headers: { 'X-CSRF-Token': csrfToken } })
    await loadExpenses()
  }

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (selectedCategoryId) params.set('category', selectedCategoryId)
    if (search) params.set('search', search)
    const base = api.defaults.baseURL?.replace(/\/$/, '') || '/api'
    window.location.href = `${base}/expenses/export/csv?${params.toString()}`
  }

  const exportPdf = () => {
    const params = new URLSearchParams()
    if (selectedCategoryId) params.set('category', selectedCategoryId)
    if (search) params.set('search', search)
    const base = api.defaults.baseURL?.replace(/\/$/, '') || '/api'
    window.location.href = `${base}/expenses/export/pdf?${params.toString()}`
  }

  return (
    <div>
      <div className="card card-body mb-4">
        <h5 className="card-title">Filter</h5>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Search</label>
            <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item, description or amount" />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Category</label>
            <select className="form-select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">Page Size</label>
            <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[10,20,30,40,50,60,90,100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2 d-flex gap-2 flex-wrap justify-content-md-end">
            <button className="btn btn-primary btn-sm" onClick={exportCsv}>Export CSV</button>
            <button className="btn btn-warning btn-sm" onClick={exportPdf}>Export PDF</button>
          </div>
        </div>
      </div>

      <div ref={formRef}>
        <ExpenseForm
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSubmit={handleAddOrUpdate}
          editingExpense={editing}
          loading={loading}
        />
      </div>

      <div className="card card-body">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <h5 className="card-title" style={{ marginBottom: '2.2rem' }}>Expenses</h5>
          <div className="mt-1 mt-md-0">
            <span className="fw-bold text-success text-uppercase">Category: {categories.find((c) => c._id === selectedCategoryId)?.name || 'All'}</span>
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <ExpenseTable
              expenses={expenses}
              onEdit={(e) => {
                setEditing(e)
                setTimeout(() => {
                  if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 0)
              }}
              onDelete={handleDelete}
              sort={sort}
              setSort={setSort}
              showCategoryColumn={!selectedCategoryId}
              summaryInfo={selectedCategoryId ? summaryInfo : null}
            />
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item prev ${page === 1 ? 'disabled' : ''}`}>
                    <button type="button" className="page-link" aria-label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                  </li>
                  {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                    <li className={`page-item ${page === p ? 'active' : ''}`} key={p}>
                      <button type="button" className="page-link" aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>{p}</button>
                    </li>
                  ))}
                  <li className={`page-item next ${page >= pages ? 'disabled' : ''}`}>
                    <button type="button" className="page-link" aria-label="Next page" onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
                  </li>
                </ul>
              </nav>
              <div className="pagination-count text-muted">Total: {total} items</div>
            </div>
          </>
        )}
      </div>

      {/* Charts removed */}
    </div>
  )
}