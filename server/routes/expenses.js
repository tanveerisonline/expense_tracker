const express = require('express')
const { body, validationResult } = require('express-validator')
const { Parser } = require('json2csv')
const PDFDocument = require('pdfkit')
const auth = require('../middleware/auth')
const Expense = require('../models/Expense')
const Category = require('../models/Category')

const router = express.Router()

// Validate custom fields based on category definition
async function validateCustomFields(userId, categoryId, customFields) {
  const category = await Category.findOne({ _id: categoryId, userId })
  if (!category) throw new Error('Invalid category')
  const keys = new Set((category.fields || []).map((f) => f.key))
  if (customFields && typeof customFields === 'object') {
    Object.keys(customFields).forEach((k) => {
      if (!keys.has(k)) delete customFields[k]
    })
  }
  return category
}

// List expenses with filters, sorting, pagination
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, sort = 'date:desc', search = '', category } = req.query
  const [sortKey, sortDir] = String(sort).split(':')
  const query = { userId: req.user.id }
  if (category) query.categoryId = category
  if (search) {
    const num = Number(search)
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      ...(isNaN(num) ? [] : [{ amount: num }]),
    ]
  }
  const items = await Expense.find(query)
    .populate('categoryId', 'name')
    .sort({ [sortKey]: sortDir === 'asc' ? 1 : -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
  const total = await Expense.countDocuments(query)
  const mapped = items.map((e) => ({
    _id: e._id,
    amount: e.amount,
    date: e.date,
    description: e.description,
    category: { _id: e.categoryId?._id, name: e.categoryId?.name },
    customFields: e.customFields,
  }))
  res.json({ items: mapped, total })
})

// Create expense
router.post(
  '/',
  auth,
  [
    body('categoryId').isString(),
    body('amount').isFloat({ gt: 0 }),
    body('date').isISO8601(),
    body('description').optional().isString(),
    body('customFields').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { categoryId, amount, date, description, customFields = {} } = req.body
    await validateCustomFields(req.user.id, categoryId, customFields)
    const expense = await Expense.create({ userId: req.user.id, categoryId, amount, date, description, customFields })
    res.status(201).json({ expense })
  }
)

// Update expense
router.put(
  '/:id',
  auth,
  [
    body('categoryId').isString(),
    body('amount').isFloat({ gt: 0 }),
    body('date').isISO8601(),
    body('description').optional().isString(),
    body('customFields').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { id } = req.params
    const { categoryId, amount, date, description, customFields = {} } = req.body
    await validateCustomFields(req.user.id, categoryId, customFields)
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { categoryId, amount, date, description, customFields },
      { new: true }
    )
    if (!expense) return res.status(404).json({ message: 'Not found' })
    res.json({ expense })
  }
)

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params
  const exp = await Expense.findOneAndDelete({ _id: id, userId: req.user.id })
  if (!exp) return res.status(404).json({ message: 'Not found' })
  res.json({ message: 'Deleted' })
})

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  const { search = '', category } = req.query
  const query = { userId: req.user.id }
  if (category) query.categoryId = category
  if (search) {
    const num = Number(search)
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      ...(isNaN(num) ? [] : [{ amount: num }]),
    ]
  }
  const items = await Expense.find(query).populate('categoryId', 'name')
  const rows = items.map((e) => ({
    Date: new Date(e.date).toLocaleDateString(),
    Category: e.categoryId?.name,
    Amount: e.amount,
    Description: e.description,
  }))
  const parser = new Parser()
  const csv = parser.parse(rows)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"')
  res.send(csv)
})

// Export PDF
router.get('/export/pdf', auth, async (req, res) => {
  const { search = '', category } = req.query
  const query = { userId: req.user.id }
  if (category) query.categoryId = category
  if (search) {
    const num = Number(search)
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      ...(isNaN(num) ? [] : [{ amount: num }]),
    ]
  }
  const items = await Expense.find(query).populate('categoryId', 'name')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.pdf"')
  const doc = new PDFDocument({ margin: 40 })
  doc.pipe(res)
  doc.fontSize(18).text('Expenses Report', { align: 'center' })
  doc.moveDown()
  items.forEach((e) => {
    doc.fontSize(12).text(`${new Date(e.date).toLocaleDateString()} | ${e.categoryId?.name} | ${e.amount.toFixed(2)} | ${e.description || ''}`)
  })
  doc.end()
})

// Bulk delete expenses by category and date range or last N days
router.post(
  '/bulk-delete',
  auth,
  [
    body('categoryId').isString(),
    body('from').optional().isISO8601(),
    body('to').optional().isISO8601(),
    body('days').optional().isInt({ gt: 0, lt: 36500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { categoryId, from, to, days } = req.body

    // Ensure category belongs to user
    const category = await Category.findOne({ _id: categoryId, userId: req.user.id })
    if (!category) return res.status(404).json({ message: 'Invalid category' })

    const query = { userId: req.user.id, categoryId }
    if (days) {
      const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)
      query.date = { $gte: since }
    } else if (from && to) {
      const start = new Date(from)
      const end = new Date(to)
      // include entire end day
      end.setHours(23, 59, 59, 999)
      query.date = { $gte: start, $lte: end }
    } else {
      return res.status(400).json({ message: 'Provide either days or both from and to dates' })
    }

    const result = await Expense.deleteMany(query)
    res.json({ deleted: result.deletedCount })
  }
)

module.exports = router