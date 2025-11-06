import { useEffect, useState } from 'react'
import api from '../services/api'
import PaymentManager from '../components/PaymentManager'

export default function Payments() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/categories')
      // Show only categories with outstanding balance by default in manager via summary filter
      setCategories(data.categories)
    }
    load()
  }, [])

  return (
    <div>
      <h4 className="mb-3">Payments</h4>
      <PaymentManager categories={categories} />
    </div>
  )
}