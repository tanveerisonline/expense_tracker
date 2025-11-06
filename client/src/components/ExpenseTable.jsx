export default function ExpenseTable({ expenses, onEdit, onDelete, sort, setSort, showCategoryColumn = false }) {
  const toggleSort = (key) => {
    const direction = sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc'
    setSort({ key, direction })
  }
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle">
        {showCategoryColumn ? (
          <colgroup className="equal-cols-6">
            <col /><col /><col /><col /><col /><col />
          </colgroup>
        ) : (
          <colgroup className="wide-cols-5">
            <col /><col /><col /><col /><col />
          </colgroup>
        )}
        <thead>
          <tr>
            <th onClick={() => toggleSort('itemName')} role="button">Item Name</th>
            <th onClick={() => toggleSort('description')} role="button">Description</th>
            {showCategoryColumn && <th>Category</th>}
            <th onClick={() => toggleSort('amount')} role="button">Amount</th>
            <th onClick={() => toggleSort('date')} role="button">Date</th>
            <th className="text-end actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={showCategoryColumn ? 6 : 5} className="text-center text-muted">No expenses found. Use the form above to add one.</td>
            </tr>
          ) : (
            expenses.map((e) => (
              <tr key={e._id}>
                <td>{e.itemName || ''}</td>
                <td className="text-break">{e.description}</td>
                {showCategoryColumn && <td className="text-break">{e.category?.name || ''}</td>}
                <td className="text-nowrap">{Number(e.amount).toFixed(2)}</td>
                <td className="text-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                <td className="text-end actions-cell">
                  <div className="d-inline-flex gap-2 justify-content-end flex-wrap">
                    <button className="btn btn-sm btn-primary" onClick={() => onEdit(e)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      if (window.confirm('Delete this expense?')) onDelete(e._id)
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
        {expenses.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={showCategoryColumn ? 6 : 5} className="text-start fw-bold">Total: {totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}