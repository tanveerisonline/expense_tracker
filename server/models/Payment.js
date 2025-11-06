const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', paymentSchema)