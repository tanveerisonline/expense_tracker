const express = require('express')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')
const Category = require('../models/Category')

const router = express.Router()

// List categories for current user
router.get('/', auth, async (req, res) => {
  const categories = await Category.find({ userId: req.user.id }).sort({ name: 1 })
  res.json({ categories })
})

// Create category
router.post(
  '/',
  auth,
  [
    body('name').isString().isLength({ min: 1 }),
    body('fields').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { name, fields = [] } = req.body
    const exists = await Category.findOne({ userId: req.user.id, name })
    if (exists) return res.status(409).json({ message: 'Category already exists' })
    const category = await Category.create({ userId: req.user.id, name, fields })
    res.status(201).json({ category })
  }
)

// Seed default categories for the user
router.post('/seed-default', auth, async (req, res) => {
  const { names = [] } = req.body
  const existing = await Category.find({ userId: req.user.id })
  const existingNames = new Set(existing.map((c) => c.name))
  const toCreate = names.filter((n) => !existingNames.has(n)).map((n) => ({ userId: req.user.id, name: n, fields: [] }))
  if (toCreate.length) await Category.insertMany(toCreate)
  res.json({ created: toCreate.length })
})

module.exports = router