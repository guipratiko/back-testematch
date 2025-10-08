const express = require('express');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/dashboard - Dashboard do usuário
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Buscar estatísticas do usuário
    const totalAnalyses = await Analysis.countDocuments({ user: req.user._id });
    const completedAnalyses = await Analysis.countDocuments({ 
      user: req.user._id, 
      status: 'completed' 
    });
    const pendingAnalyses = await Analysis.countDocuments({ 
      user: req.user._id, 
      status: { $in: ['pending', 'processing'] } 
    });

    // Buscar análises recentes
    const recentAnalyses = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status plan createdAt creditsUsed');

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        credits: req.user.credits,
        plan: req.user.plan,
        createdAt: req.user.createdAt
      },
      stats: {
        totalAnalyses,
        completedAnalyses,
        pendingAnalyses,
        successRate: totalAnalyses > 0 ? Math.round((completedAnalyses / totalAnalyses) * 100) : 0
      },
      recentAnalyses: recentAnalyses.map(analysis => ({
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        creditsUsed: analysis.creditsUsed,
        createdAt: analysis.createdAt
      }))
    });
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/user/settings - Obter configurações do usuário
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/user/settings - Atualizar configurações
router.put('/settings', authenticateToken, async (req, res) => {
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
      message: 'Configurações atualizadas com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/user/account - Desativar conta
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Senha é obrigatória para desativar a conta'
      });
    }

    // Verificar senha
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Senha incorreta'
      });
    }

    // Desativar conta (soft delete)
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false
    });

    res.json({
      message: 'Conta desativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar conta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/user/analyses - Listar todas as análises do usuário
router.get('/analyses', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, plan } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-result');

    const total = await Analysis.countDocuments(filter);

    res.json({
      analyses: analyses.map(analysis => ({
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        creditsUsed: analysis.creditsUsed,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        processingTime: analysis.processingTime,
        errorMessage: analysis.errorMessage,
        isPublic: analysis.isPublic
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar análises:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
