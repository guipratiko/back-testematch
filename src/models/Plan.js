const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['basic', 'complete', 'credits_pack'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    required: true
  },
  features: {
    type: [String],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Índices
planSchema.index({ type: 1, isActive: 1 });
planSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Plan', planSchema);
