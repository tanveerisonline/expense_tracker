const mongoose = require('mongoose')

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'boolean', 'select'], default: 'text' },
    options: [{ type: String }],
  },
  { _id: false }
)

const categorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    fields: [fieldSchema],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', categorySchema)