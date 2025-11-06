require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const morgan = require('morgan')
const mongoSanitize = require('mongo-sanitize')

const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categories')
const expenseRoutes = require('./routes/expenses')
const statsRoutes = require('./routes/stats')

const app = express()

const PORT = process.env.PORT || 5000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'token'

// Security & parsing
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use((req, res, next) => {
  // sanitize body, query, params
  if (req.body) req.body = mongoSanitize(req.body)
  if (req.query) req.query = mongoSanitize(req.query)
  if (req.params) req.params = mongoSanitize(req.params)
  next()
})

// CORS for SPA with cookies
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  })
)

// CSRF protection using cookies
const csrfProtection = csrf({ cookie: { key: process.env.CSRF_COOKIE_NAME || '_csrf', sameSite: 'lax', httpOnly: true } })

// Routes
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

app.use('/api/auth', csrfProtection, authRoutes)
app.use('/api/categories', csrfProtection, categoryRoutes)
app.use('/api/expenses', csrfProtection, expenseRoutes)
app.use('/api/stats', csrfProtection, statsRoutes)

// Connect DB and start server
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  } catch (e) {
    console.error('Failed to start server', e)
    process.exit(1)
  }
}

start()