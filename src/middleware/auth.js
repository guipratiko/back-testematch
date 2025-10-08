const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso necessário'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Erro na autenticação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Middleware opcional para autenticação (não bloqueia se não tiver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Se houver erro no token, continua sem usuário autenticado
    next();
  }
};

// Middleware para verificar se usuário tem créditos suficientes
const checkCredits = (requiredCredits = 1) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    if (req.user.credits < requiredCredits) {
      return res.status(402).json({
        error: 'Créditos insuficientes',
        required: requiredCredits,
        available: req.user.credits
      });
    }

    next();
  };
};

// Middleware para verificar se usuário tem plano específico
const checkPlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    if (req.user.plan !== requiredPlan) {
      return res.status(403).json({
        error: 'Plano insuficiente',
        required: requiredPlan,
        current: req.user.plan
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkCredits,
  checkPlan
};
