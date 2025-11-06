const express = require('express')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

const issueToken = (res, user) => {
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie(process.env.JWT_COOKIE_NAME || 'token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

router.post(
  '/signup',
  [body('name').isString().isLength({ min: 1 }), body('email').isEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    issueToken(res, user)
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  }
)

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const matches = await bcrypt.compare(password, user.passwordHash)
    if (!matches) return res.status(401).json({ message: 'Invalid credentials' })
    issueToken(res, user)
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  }
)

router.post('/logout', async (req, res) => {
  res.clearCookie(process.env.JWT_COOKIE_NAME || 'token')
  res.json({ message: 'Logged out' })
})

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies[process.env.JWT_COOKIE_NAME || 'token']
    if (!token) return res.json({ user: null })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    if (!user) return res.json({ user: null })
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  } catch (e) {
    res.json({ user: null })
  }
})

module.exports = router