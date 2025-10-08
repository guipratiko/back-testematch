const express = require('express');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { authenticateToken, checkCredits } = require('../middleware/auth');
const { validateUpload } = require('../middleware/validation');

const router = express.Router();

// POST /api/upload - Criar nova análise (sem upload de imagem)
router.post('/', authenticateToken, validateUpload, checkCredits(1), async (req, res) => {
  try {
    const { plan, imageUrl, imageId } = req.body;
    
    // Verificar se o plano é válido
    if (!['basic', 'complete'].includes(plan)) {
      return res.status(400).json({
        error: 'Plano deve ser "basic" ou "complete"'
      });
    }

    // Determinar créditos necessários
    const creditsRequired = plan === 'basic' ? 1 : 3;
    
    if (req.user.credits < creditsRequired) {
      return res.status(402).json({
        error: 'Créditos insuficientes',
        required: creditsRequired,
        available: req.user.credits
      });
    }

    // Criar análise no banco
    const analysis = new Analysis({
      user: req.user._id,
      imageUrl: imageUrl || '', // URL da imagem processada pelo n8n
      imageId: imageId || '', // ID da imagem no Cloudinary
      creditsUsed: creditsRequired,
      plan,
      status: 'pending'
    });

    await analysis.save();

    // Debitar créditos do usuário
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { credits: -creditsRequired }
    });

    // Registrar transação de crédito
    const creditTransaction = new CreditTransaction({
      user: req.user._id,
      type: 'usage',
      amount: -creditsRequired,
      description: `Análise ${plan} - ${analysis._id}`,
      plan,
      analysisId: analysis._id,
      status: 'completed'
    });

    await creditTransaction.save();

    res.status(201).json({
      message: 'Análise criada com sucesso',
      analysis: {
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        creditsUsed: analysis.creditsUsed,
        createdAt: analysis.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar análise:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/upload/status/:id - Verificar status da análise
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Análise não encontrada'
      });
    }

    res.json({
      analysis: {
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        creditsUsed: analysis.creditsUsed,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        processingTime: analysis.processingTime,
        errorMessage: analysis.errorMessage
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
