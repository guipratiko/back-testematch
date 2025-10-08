const express = require('express');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { validateN8nWebhook, validateAppMaxWebhook } = require('../middleware/validation');

const router = express.Router();

// POST /api/webhook/n8n - Receber resultado da análise do n8n
router.post('/n8n', validateN8nWebhook, async (req, res) => {
  try {
    const { 
      analysisId, 
      status, 
      result, 
      processingTime, 
      errorMessage,
      imageUrl,
      imageId 
    } = req.body;

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({
        error: 'Análise não encontrada'
      });
    }

    // Atualizar status da análise
    analysis.status = status;
    analysis.processingTime = processingTime;

    // Atualizar dados da imagem se fornecidos pelo n8n
    if (imageUrl) {
      analysis.imageUrl = imageUrl;
    }
    if (imageId) {
      analysis.imageId = imageId;
    }

    if (status === 'completed' && result) {
      analysis.result = {
        mbti: result.mbti,
        personalityTraits: result.personalityTraits || [],
        loveStyle: result.loveStyle,
        redFlags: result.redFlags || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        compatibility: {
          passionScore: result.compatibility?.passionScore,
          idealColor: result.compatibility?.idealColor,
          idealMatch: result.compatibility?.idealMatch
        },
        celebrities: {
          brazilian: result.celebrities?.brazilian,
          international: result.celebrities?.international
        },
        tips: result.tips || [],
        conversationScripts: result.conversationScripts || [],
        infographicUrl: result.infographicUrl,
        qrCode: result.qrCode
      };
    } else if (status === 'failed') {
      analysis.errorMessage = errorMessage;
      
      // Reembolsar créditos em caso de falha
      await User.findByIdAndUpdate(analysis.user, {
        $inc: { credits: analysis.creditsUsed }
      });

      // Registrar transação de reembolso
      const refundTransaction = new CreditTransaction({
        user: analysis.user,
        type: 'refund',
        amount: analysis.creditsUsed,
        description: `Reembolso - Análise falhou: ${analysis._id}`,
        analysisId: analysis._id,
        status: 'completed'
      });

      await refundTransaction.save();
    }

    await analysis.save();

    res.json({
      message: 'Webhook processado com sucesso',
      analysisId: analysis._id,
      status: analysis.status
    });

  } catch (error) {
    console.error('Erro no webhook n8n:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/webhook/appmax - Receber confirmação de pagamento do AppMax
router.post('/appmax', validateAppMaxWebhook, async (req, res) => {
  try {
    const { 
      transactionId, 
      status, 
      amount, 
      userId, 
      plan, 
      credits,
      metadata = {} 
    } = req.body;

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    let creditTransaction = await CreditTransaction.findOne({ 
      paymentId: transactionId 
    });

    if (!creditTransaction) {
      // Criar nova transação se não existir
      creditTransaction = new CreditTransaction({
        user: userId,
        type: 'purchase',
        amount: credits || 0,
        description: `Compra de ${plan} - ${transactionId}`,
        plan,
        paymentId: transactionId,
        status: 'pending',
        metadata
      });
    }

    // Atualizar status da transação
    creditTransaction.status = status;

    if (status === 'approved') {
      // Adicionar créditos ao usuário
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: credits || 0 },
        $set: { plan: plan || user.plan }
      });

      creditTransaction.amount = credits || 0;
      creditTransaction.status = 'completed';
    } else if (status === 'cancelled' || status === 'refunded') {
      creditTransaction.status = 'failed';
    }

    await creditTransaction.save();

    res.json({
      message: 'Webhook AppMax processado com sucesso',
      transactionId,
      status: creditTransaction.status
    });

  } catch (error) {
    console.error('Erro no webhook AppMax:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/webhook/test - Teste de webhook
router.get('/test', (req, res) => {
  res.json({
    message: 'Webhook endpoint funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;
