import axios from 'axios'

// Allow overriding API base URL in production via Vite env
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
})

export default api