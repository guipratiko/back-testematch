const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Confiar em proxies (nginx, cloudflare, etc)
// 1 = confiar apenas no primeiro proxy (mais seguro)
app.set('trust proxy', 1);

// Middlewares de segurança
app.use(helmet());

// CORS - permitir múltiplas origens
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3750',
  'https://testematch.com',
  'https://www.testematch.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (isDevelopment ? 60 * 1000 : 15 * 60 * 1000), // 1 min em dev, 15 min em prod
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDevelopment ? 1000 : 100), // 1000 em dev, 100 em prod
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Validação desabilitada para evitar warnings em desenvolvimento
  validate: {
    trustProxy: false,
    xForwardedForHeader: false
  }
});
app.use('/api/', limiter);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ Conectado ao MongoDB');
})
.catch((error) => {
  console.error('❌ Erro ao conectar ao MongoDB:', error);
  process.exit(1);
});

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');
const creditsRoutes = require('./routes/credits');
const webhookRoutes = require('./routes/webhook');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/webhook', webhookRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Teste Match Backend'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
  console.log('\n📡 Webhooks disponíveis:');
  console.log(`   🔔 N8N:     POST http://localhost:${PORT}/api/webhook/n8n`);
  console.log(`   💰 AppMax:  POST http://localhost:${PORT}/api/webhook/appmax`);
  console.log(`   🧪 Test:    GET  http://localhost:${PORT}/api/webhook/test`);
  console.log('\n🔊 Aguardando requisições de webhook...\n');
});
