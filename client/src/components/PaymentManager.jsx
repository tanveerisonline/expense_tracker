import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PaymentManager({ categories }) {
  const { csrfToken } = useAuth()
  const [categoryId, setCategoryId] = useState('')
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async (cid) => {
    if (!cid) { setSummary(null); setPayments([]); return }
    try {
      const { data } = await api.get(`/payments/summary?categoryId=${cid}`)
      const s = data.summary?.[0] || null
      // Fallback summary to allow entering payments when no history yet
      if (!s) {
        const cat = categories.find((c) => c._id === cid)
        setSummary({ categoryId: cid, name: cat?.name || '', totalExpenses: 0, totalPaid: 0, balance: 0 })
      } else {
        setSummary(s)
      }
      setPayments(data.payments || [])
    } catch (e) {
      setSummary({ categoryId: cid, name: '', totalExpenses: 0, totalPaid: 0, balance: 0 })
      setPayments([])
      setError(e?.response?.data?.message || 'Failed to load summary')
    }
  }, [categories])

  useEffect(() => {
    if (categoryId) loadSummary(categoryId)
  }, [categoryId, loadSummary])

  const outstanding = typeof summary?.balance === 'number'
    ? summary.balance
    : Math.max(0, (summary?.totalExpenses || 0) - (summary?.totalPaid || 0))

  const payFull = () => {
    setAmount(String(outstanding || 0))
    setDate(new Date().toISOString().slice(0, 10))
  }

  const submitPayment = async (e) => {
    e.preventDefault()
    if (!categoryId) return
    const num = Number(amount)
    if (!num || num <= 0) { setError('Enter a valid amount'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/payments', { categoryId, amount: num, date, note }, { headers: { 'X-CSRF-Token': csrfToken } })
      setAmount('')
      setDate('')
      setNote('')
      await loadSummary(categoryId)
      // Notify other pages (Home) to refresh totals and balances immediately
      window.dispatchEvent(new CustomEvent('payments-updated', { detail: { categoryId } }))
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-body">
      <h5 className="card-title">Category Payments</h5>
      <div className="row g-3 align-items-end mb-3">
        <div className="col-12 col-md-4">
          <label className="form-label">Category</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <div className="mb-3">
          <div className="summary-boxes d-flex flex-column flex-md-row gap-3">
            <div className="p-3 border rounded"><div className="fw-bold">Total</div><div>{summary.totalExpenses?.toFixed(2)}</div></div>
            <div className="p-3 border rounded"><div className="fw-bold">Amount Paid</div><div>{summary.totalPaid?.toFixed(2)}</div></div>
            <div className="p-3 border rounded"><div className="fw-bold">Balance</div><div className="text-danger fw-bold">{outstanding.toFixed(2)}</div></div>
          </div>
          {summary.totalExpenses === 0 && summary.totalPaid === 0 && (
            <div className="text-muted mt-2">No expenses yet for this category.</div>
          )}
        </div>
      )}

      {summary && (
        <form onSubmit={submitPayment} className="mb-3 payments-form">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Amount</label>
              <input className="form-control" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Date</label>
              <input
                className="form-control"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                onFocus={(e) => { try { e.target.showPicker && e.target.showPicker() } catch { /* showPicker not supported */ } }}
                onMouseDown={(e) => { try { if (e.target.showPicker) { e.preventDefault(); e.target.showPicker() } } catch { /* showPicker not supported */ } }}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Note</label>
              <input className="form-control" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            </div>
            <div className="col-12 col-md-3 d-flex gap-2 actions-cell">
              <button type="button" className="btn btn-warning btn-sm" onClick={payFull} disabled={!outstanding}>Pay Full</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Pay Some</button>
            </div>
          </div>
          {error && <div className="text-danger mt-2">{error}</div>}
        </form>
      )}

      {summary && (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount Paid</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={3} className="text-center">No payments yet</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td>{new Date(p.date).toLocaleDateString()}</td>
                    <td>{p.amount.toFixed(2)}</td>
                    <td>{p.note || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}