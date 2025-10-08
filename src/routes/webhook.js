const express = require('express');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { validateN8nWebhook, validateAppMaxWebhook } = require('../middleware/validation');

const router = express.Router();

// POST /api/webhook/n8n - Receber resultado da análise do n8n
router.post('/n8n', validateN8nWebhook, async (req, res) => {
  try {
    console.log('\n🔔 ========== WEBHOOK N8N RECEBIDO ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('🌐 IP:', req.ip);
    console.log('🔗 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('==========================================\n');

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
    console.log('\n💰 ========== WEBHOOK APPMAX RECEBIDO ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('🌐 IP:', req.ip);
    console.log('🔗 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('===============================================\n');

    const { 
      transactionId, 
      status, 
      amount, 
      name,
      email,
      cpf,
      phone,
      plan,
      credits,
      WEBHOOK_SECRET
    } = req.body;

    // Verificar secret do webhook
    if (WEBHOOK_SECRET !== process.env.APPMAX_WEBHOOK_SECRET) {
      return res.status(403).json({
        error: 'Secret inválido'
      });
    }

    // Normalizar status (português -> inglês)
    const statusMap = {
      'aprovado': 'approved',
      'autorizado': 'approved',
      'pendente': 'pending',
      'cancelado': 'cancelled',
      'reembolsado': 'refunded'
    };
    const normalizedStatus = statusMap[status] || status;

    // Buscar usuário por CPF
    let user = await User.findOne({ cpf });

    if (!user && normalizedStatus === 'approved') {
      // Criar pré-cadastro se não existir
      // Usar email do payload ou gerar temporário
      const userEmail = email || `user_${cpf}@testematch.temp`;
      
      user = new User({
        name,
        email: userEmail,
        cpf,
        phone,
        credits: 0,
        plan: plan || 'free',
        accountStatus: 'pending', // SEMPRE pending - usuário precisa configurar senha
        password: Math.random().toString(36).slice(-8) // senha temporária
      });

      await user.save();
    }

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado e status não é aprovado'
      });
    }

    // Verificar se já existe transação com este ID
    let creditTransaction = await CreditTransaction.findOne({ 
      paymentId: transactionId 
    });

    if (!creditTransaction) {
      // Criar nova transação
      creditTransaction = new CreditTransaction({
        user: user._id,
        type: 'purchase',
        amount: parseInt(credits) || 0,
        description: `Compra de ${credits} créditos - ${transactionId}`,
        paymentId: transactionId,
        status: 'pending',
        metadata: {
          originalAmount: amount,
          originalStatus: status
        }
      });
    }

    // Atualizar status da transação
    if (normalizedStatus === 'approved') {
      // Adicionar créditos ao usuário
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: parseInt(credits) || 0 }
      });

      creditTransaction.amount = parseInt(credits) || 0;
      creditTransaction.status = 'completed';
    } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'refunded') {
      creditTransaction.status = 'failed';
    } else {
      creditTransaction.status = normalizedStatus;
    }

    await creditTransaction.save();

    const response = {
      message: 'Webhook AppMax processado com sucesso',
      transactionId,
      userId: user._id,
      status: creditTransaction.status,
      setupPasswordUrl: user.accountStatus === 'pending' ? `https://testematch.com/setup-password/${user._id}` : null
    };

    console.log('\n✅ ========== WEBHOOK PROCESSADO COM SUCESSO ==========');
    console.log('👤 Usuário:', user.name);
    console.log('🆔 User ID:', user._id);
    console.log('📧 Email:', user.email);
    console.log('📱 Telefone:', user.phone);
    console.log('🎫 CPF:', user.cpf);
    console.log('📦 Plan:', user.plan);
    console.log('🔄 Account Status:', user.accountStatus);
    console.log('💳 Créditos adicionados:', parseInt(credits));
    console.log('💰 Total de créditos agora:', await User.findById(user._id).then(u => u.credits));
    console.log('📊 Status da transação:', creditTransaction.status);
    console.log('🔗 Setup URL:', response.setupPasswordUrl);
    console.log('====================================================\n');

    res.json(response);

  } catch (error) {
    console.log('\n❌ ========== ERRO NO WEBHOOK APPMAX ==========');
    console.log('⚠️ Erro:', error.message);
    console.log('📦 Stack:', error.stack);
    console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
    console.log('=============================================\n');
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
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
