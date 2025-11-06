import { Pie, Line } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

export default function ChartSection({ byCategory, byDate }) {
  const pieData = {
    labels: byCategory.map((c) => c.name),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'],
      },
    ],
  }

  const lineData = {
    labels: byDate.map((d) => d.date),
    datasets: [
      {
        label: 'Daily Spend',
        data: byDate.map((d) => d.total),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.2)',
      },
    ],
  }

  return (
    <div className="row g-4 mt-1">
      <div className="col-lg-6">
        <div className="card card-body">
          <h5>Spend by Category</h5>
          <Pie data={pieData} />
        </div>
      </div>
      <div className="col-lg-6">
        <div className="card card-body">
          <h5>Daily Spend</h5>
          <Line data={lineData} />
        </div>
      </div>
    </div>
  )
}