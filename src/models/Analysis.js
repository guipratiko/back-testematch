const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageId: {
    type: String, // ID da imagem no Cloudinary
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  creditsUsed: {
    type: Number,
    required: true,
    min: 1
  },
  plan: {
    type: String,
    enum: ['basic', 'complete'],
    required: true
  },
  
  // Resultado da análise (preenchido pelo webhook do n8n)
  result: {
    mbti: {
      type: String,
      trim: true
    },
    personalityTraits: {
      type: [String],
      default: []
    },
    loveStyle: {
      type: String,
      trim: true
    },
    redFlags: {
      type: [String],
      default: []
    },
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    },
    compatibility: {
      passionScore: {
        type: Number,
        min: 0,
        max: 100
      },
      idealColor: {
        type: String,
        trim: true
      },
      idealMatch: {
        type: String,
        trim: true
      }
    },
    celebrities: {
      brazilian: {
        name: String,
        similarity: Number,
        description: String
      },
      international: {
        name: String,
        similarity: Number,
        description: String
      }
    },
    tips: {
      type: [String],
      default: []
    },
    conversationScripts: {
      type: [String],
      default: []
    },
    infographicUrl: {
      type: String
    },
    qrCode: {
      type: String
    }
  },
  
  // Metadados
  processingTime: {
    type: Number // em segundos
  },
  errorMessage: {
    type: String
  },
  
  // Para controle de acesso
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Índices
analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ status: 1 });
// shareToken já tem unique: true na definição do schema, não precisa de index() adicional

// Middleware para gerar token de compartilhamento
analysisSchema.pre('save', function(next) {
  if (this.isPublic && !this.shareToken) {
    this.shareToken = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Analysis', analysisSchema);
