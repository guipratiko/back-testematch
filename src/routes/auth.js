const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, checkCredits } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Cadastro de usuário
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, phone, cpf } = req.body;

    // Verificar se usuário já existe por email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({
        error: 'Email já cadastrado'
      });
    }

    // Verificar se CPF já existe
    const existingUserByCpf = await User.findOne({ cpf });
    if (existingUserByCpf) {
      return res.status(409).json({
        error: 'CPF já cadastrado'
      });
    }

    // Criar novo usuário
    const user = new User({
      name,
      email,
      password,
      phone,
      cpf
    });

    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/login - Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar se conta está ativa
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada'
      });
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/profile - Obter perfil do usuário
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        credits: req.user.credits,
        plan: req.user.plan,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/auth/profile - Atualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (preferences !== undefined) {
      updates.preferences = { ...req.user.preferences, ...preferences };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      message: 'Token renovado com sucesso',
      token
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
