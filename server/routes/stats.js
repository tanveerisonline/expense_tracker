const express = require('express')
const auth = require('../middleware/auth')
const Expense = require('../models/Expense')
const Category = require('../models/Category')

const router = express.Router()

router.get('/summary', auth, async (req, res) => {
  const byCategoryAgg = await Expense.aggregate([
    { $match: { userId: req.user.id } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $unwind: '$cat' },
    { $project: { name: '$cat.name', total: 1 } },
    { $sort: { total: -1 } },
  ])

  const byDateAgg = await Expense.aggregate([
    { $match: { userId: req.user.id } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } },
    { $project: { date: '$_id', total: 1, _id: 0 } },
    { $sort: { date: 1 } },
  ])

  res.json({ byCategory: byCategoryAgg, byDate: byDateAgg })
})

module.exports = router