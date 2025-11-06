const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    itemName: { type: String },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String },
    customFields: { type: Object },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Expense', expenseSchema)