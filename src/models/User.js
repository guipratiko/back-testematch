const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: function() {
      return this.accountStatus === 'active';
    },
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'active'
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true,
    match: [/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos']
  },
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{11}$/, 'CPF deve ter 11 dígitos']
  },
  credits: {
    type: Number,
    default: 0,
    min: [0, 'Créditos não podem ser negativos']
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'complete', 'premium'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailMarketing: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Middleware para processar telefone antes de salvar
userSchema.pre('save', function(next) {
  if (this.isModified('phone') && this.phone) {
    // DDDs de São Paulo que mantêm o nono dígito
    const saoPauloDDDs = ['11', '12', '13', '14', '15', '16', '17', '18', '19'];
    
    // Remove todos os caracteres não numéricos
    const cleanPhone = this.phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      const ddd = cleanPhone.substring(0, 2);
      
      // Se não for DDD de São Paulo, remove o nono dígito
      if (!saoPauloDDDs.includes(ddd)) {
        // Remove o 9 do início do número (posição 2)
        this.phone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
      } else {
        // Mantém o telefone como está para DDDs de São Paulo
        this.phone = cleanPhone;
      }
    }
  }
  next();
});

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para remover senha do JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Índices
// email e cpf já têm unique: true na definição do schema, não precisam de index() adicional
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
