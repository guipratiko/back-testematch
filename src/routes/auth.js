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

    // Verificar se conta está suspensa
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada'
      });
    }

    // Verificar se precisa configurar senha
    if (user.accountStatus === 'pending') {
      return res.status(403).json({
        error: 'Conta pendente de ativação',
        requireSetup: true,
        setupUrl: `/setup-password/${user._id}`
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

// GET /api/auth/setup-password/:userId - Verificar se usuário precisa configurar senha
router.get('/setup-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email cpf phone accountStatus plan credits');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (user.accountStatus !== 'pending') {
      return res.status(400).json({
        error: 'Conta já está ativa',
        redirect: '/login'
      });
    }

    console.log('\n🔍 ========== GET SETUP PASSWORD ==========');
    console.log('🆔 User ID:', userId);
    console.log('👤 Nome:', user.name);
    console.log('📧 Email:', user.email);
    console.log('💳 Créditos:', user.credits);
    console.log('📦 Plan:', user.plan);
    console.log('==========================================\n');

    const response = {
      user: {
        name: user.name,
        email: user.email.includes('@testematch.temp') ? '' : user.email,
        cpf: user.cpf,
        phone: user.phone,
        plan: user.plan,
        credits: user.credits,
        needsEmail: user.email.includes('@testematch.temp')
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao verificar setup de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/setup-password/:userId - Configurar senha e email
router.post('/setup-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, password } = req.body;

    // Validações básicas
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (user.accountStatus !== 'pending') {
      return res.status(400).json({
        error: 'Conta já está ativa'
      });
    }

    // Se precisa de email, validar e atualizar
    if (user.email.includes('@testematch.temp')) {
      if (!email) {
        return res.status(400).json({
          error: 'Email é obrigatório'
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email já cadastrado'
        });
      }

      user.email = email.toLowerCase().trim();
    }

    // Atualizar senha e status
    user.password = password;
    user.accountStatus = 'active';
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    res.json({
      message: 'Senha configurada com sucesso',
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
    console.error('Erro ao configurar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
