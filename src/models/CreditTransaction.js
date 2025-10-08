const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'usage', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'complete', 'credits_pack']
  },
  paymentId: {
    type: String, // ID do pagamento no AppMax
    sparse: true
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices
creditTransactionSchema.index({ user: 1, createdAt: -1 });
// paymentId já tem sparse: true na definição do schema, que cria um índice automaticamente
creditTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
