export default function ExpenseTable({ expenses, onEdit, onDelete, sort, setSort }) {
  const toggleSort = (key) => {
    const direction = sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc'
    setSort({ key, direction })
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th onClick={() => toggleSort('date')} role="button">Date</th>
            <th onClick={() => toggleSort('categoryName')} role="button">Category</th>
            <th onClick={() => toggleSort('amount')} role="button">Amount</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e._id}>
              <td>{new Date(e.date).toLocaleDateString()}</td>
              <td>{e.category?.name || e.categoryName}</td>
              <td>{Number(e.amount).toFixed(2)}</td>
              <td>{e.description}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(e)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(e._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}