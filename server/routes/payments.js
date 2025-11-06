const express = require('express')
const { body, validationResult } = require('express-validator')
const auth = require('../middleware/auth')
const Expense = require('../models/Expense')
const Category = require('../models/Category')
const Payment = require('../models/Payment')

const router = express.Router()

// Create a payment (full or partial) for a category
router.post(
  '/',
  auth,
  [
    body('categoryId').isString(),
    body('amount').isFloat({ gt: 0 }),
    body('date').optional().isISO8601(),
    body('note').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: 'Invalid input' })
    const { categoryId, amount, date, note } = req.body
    const category = await Category.findOne({ _id: categoryId, userId: req.user.id })
    if (!category) return res.status(404).json({ message: 'Invalid category' })
    const payment = await Payment.create({ userId: req.user.id, categoryId, amount, date: date ? new Date(date) : new Date(), note })
    res.status(201).json({ payment })
  }
)

// Get payments and balance summary per category
router.get('/summary', auth, async (req, res) => {
  const { categoryId } = req.query
  const userId = req.user.id

  const expenseMatch = { userId }
  const paymentMatch = { userId }
  if (categoryId) {
    expenseMatch.categoryId = categoryId
    paymentMatch.categoryId = categoryId
  }

  // Aggregate totals by category
  const expensesAgg = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: '$categoryId', totalExpenses: { $sum: '$amount' } } },
  ])

  const paymentsAgg = await Payment.aggregate([
    { $match: paymentMatch },
    { $group: { _id: '$categoryId', totalPaid: { $sum: '$amount' } } },
  ])

  const totalsByCat = new Map()
  expensesAgg.forEach((e) => totalsByCat.set(String(e._id), { categoryId: String(e._id), totalExpenses: e.totalExpenses, totalPaid: 0 }))
  paymentsAgg.forEach((p) => {
    const key = String(p._id)
    const prev = totalsByCat.get(key) || { categoryId: key, totalExpenses: 0, totalPaid: 0 }
    prev.totalPaid = p.totalPaid
    totalsByCat.set(key, prev)
  })

  // Attach category names and compute balances
  const categories = await Category.find({ userId })
  const catNameById = new Map(categories.map((c) => [String(c._id), c.name]))

  const summary = Array.from(totalsByCat.values())
    .map((t) => ({
      categoryId: t.categoryId,
      name: catNameById.get(t.categoryId) || 'Unknown',
      totalExpenses: t.totalExpenses,
      totalPaid: t.totalPaid,
      balance: Math.max(0, (t.totalExpenses || 0) - (t.totalPaid || 0)),
    }))
    .filter((s) => (categoryId ? true : s.totalPaid > 0 && s.balance > 0))

  // If single category requested, return also the list of payments with dates
  let payments = []
  if (categoryId) {
    payments = await Payment.find({ userId, categoryId }).sort({ date: -1 })
      .select('_id amount date note')
  }

  res.json({ summary, payments })
})

module.exports = router