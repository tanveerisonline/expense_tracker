const express = require('express')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')
const Category = require('../models/Category')
const Expense = require('../models/Expense')

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

// Update category (name and fields)
router.put(
  '/:id',
  auth,
  [
    body('name').isString().isLength({ min: 1 }),
    body('fields').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { id } = req.params
    const { name, fields = [] } = req.body
    const category = await Category.findOne({ _id: id, userId: req.user.id })
    if (!category) return res.status(404).json({ message: 'Category not found' })
    // Prevent duplicate names
    const nameConflict = await Category.findOne({ userId: req.user.id, name, _id: { $ne: id } })
    if (nameConflict) return res.status(409).json({ message: 'Category name already in use' })
    category.name = name
    category.fields = Array.isArray(fields) ? fields : []
    await category.save()
    res.json({ category })
  }
)

module.exports = router
// Delete category with safety check
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params
  // Ensure category belongs to user
  const category = await Category.findOne({ _id: id, userId: req.user.id })
  if (!category) return res.status(404).json({ message: 'Category not found' })
  // Block delete if any expenses reference this category
  const count = await Expense.countDocuments({ userId: req.user.id, categoryId: id })
  if (count > 0) {
    return res.status(409).json({ message: 'Cannot delete: category has related expenses' })
  }
  await Category.deleteOne({ _id: id, userId: req.user.id })
  res.json({ message: 'Deleted' })
})