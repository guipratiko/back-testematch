const express = require('express');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Plan = require('../models/Plan');
const { authenticateToken } = require('../middleware/auth');
const { validateCreditsQuery } = require('../middleware/validation');

const router = express.Router();

// GET /api/credits - Consultar créditos do usuário
router.get('/', authenticateToken, validateCreditsQuery, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Buscar transações do usuário
    const transactions = await CreditTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('analysisId', 'status plan createdAt');

    const total = await CreditTransaction.countDocuments({ user: req.user._id });

    res.json({
      credits: req.user.credits,
      plan: req.user.plan,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        plan: transaction.plan,
        status: transaction.status,
        createdAt: transaction.createdAt,
        analysis: transaction.analysisId ? {
          id: transaction.analysisId._id,
          status: transaction.analysisId.status,
          plan: transaction.analysisId.plan,
          createdAt: transaction.analysisId.createdAt
        } : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao consultar créditos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/credits/plans - Listar planos disponíveis
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1 });

    res.json({
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        credits: plan.credits,
        description: plan.description,
        features: plan.features,
        discount: plan.discount,
        originalPrice: plan.discount?.originalPrice
      }))
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/credits/purchase - Iniciar compra de créditos
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        error: 'Plano não encontrado'
      });
    }

    // Criar transação pendente
    const transaction = new CreditTransaction({
      user: req.user._id,
      type: 'purchase',
      amount: plan.credits,
      description: `Compra de ${plan.name}`,
      plan: plan.type,
      status: 'pending',
      metadata: {
        planId: plan._id,
        planName: plan.name,
        price: plan.price
      }
    });

    await transaction.save();

    // Aqui você integraria com o AppMax para processar o pagamento
    // Por enquanto, retornamos os dados necessários para o frontend
    res.json({
      message: 'Compra iniciada',
      transaction: {
        id: transaction._id,
        plan: {
          id: plan._id,
          name: plan.name,
          type: plan.type,
          price: plan.price,
          credits: plan.credits,
          description: plan.description,
          features: plan.features
        },
        paymentData: {
          // Dados que seriam enviados para o AppMax
          transactionId: transaction._id,
          userId: req.user._id,
          amount: plan.price,
          plan: plan.type,
          credits: plan.credits
        }
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar compra:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/credits/history - Histórico detalhado de créditos
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await CreditTransaction.find(filter)
      .sort({ createdAt: -1 })
      .populate('analysisId', 'status plan createdAt')
      .limit(100);

    // Calcular estatísticas
    const stats = {
      totalPurchased: 0,
      totalUsed: 0,
      totalRefunded: 0,
      totalBonus: 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'purchase' && transaction.status === 'completed') {
        stats.totalPurchased += transaction.amount;
      } else if (transaction.type === 'usage') {
        stats.totalUsed += Math.abs(transaction.amount);
      } else if (transaction.type === 'refund') {
        stats.totalRefunded += transaction.amount;
      } else if (transaction.type === 'bonus') {
        stats.totalBonus += transaction.amount;
      }
    });

    res.json({
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        plan: transaction.plan,
        status: transaction.status,
        createdAt: transaction.createdAt,
        analysis: transaction.analysisId ? {
          id: transaction.analysisId._id,
          status: transaction.analysisId.status,
          plan: transaction.analysisId.plan,
          createdAt: transaction.analysisId.createdAt
        } : null
      })),
      stats
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
