const express = require('express');
const Analysis = require('../models/Analysis');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// GET /api/analysis/:id - Obter resultado da análise
router.get('/:id', validateObjectId(), optionalAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('user', 'name email');

    if (!analysis) {
      return res.status(404).json({
        error: 'Análise não encontrada'
      });
    }

    // Verificar se é público ou se o usuário tem acesso
    const isOwner = req.user && req.user._id.toString() === analysis.user._id.toString();
    const isPublic = analysis.isPublic;

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    // Se não é o dono, mostrar apenas teaser
    if (!isOwner) {
      return res.json({
        analysis: {
          id: analysis._id,
          status: analysis.status,
          plan: analysis.plan,
          createdAt: analysis.createdAt,
          teaser: {
            mbti: analysis.result?.mbti,
            passionScore: analysis.result?.compatibility?.passionScore,
            idealColor: analysis.result?.compatibility?.idealColor,
            brazilianCelebrity: analysis.result?.celebrities?.brazilian?.name,
            internationalCelebrity: analysis.result?.celebrities?.international?.name
          },
          isOwner: false,
          requiresCredits: true
        }
      });
    }

    // Se é o dono, mostrar resultado completo
    res.json({
      analysis: {
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        creditsUsed: analysis.creditsUsed,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        processingTime: analysis.processingTime,
        result: analysis.result,
        isOwner: true,
        isPublic: analysis.isPublic,
        shareToken: analysis.shareToken
      }
    });
  } catch (error) {
    console.error('Erro ao obter análise:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/analysis - Listar análises do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

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
        errorMessage: analysis.errorMessage
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

// PUT /api/analysis/:id/public - Tornar análise pública/privada
router.put('/:id/public', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { isPublic } = req.body;

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Análise não encontrada'
      });
    }

    if (analysis.status !== 'completed') {
      return res.status(400).json({
        error: 'Apenas análises concluídas podem ser compartilhadas'
      });
    }

    analysis.isPublic = Boolean(isPublic);
    await analysis.save();

    res.json({
      message: `Análise ${isPublic ? 'tornada pública' : 'tornada privada'} com sucesso`,
      isPublic: analysis.isPublic,
      shareToken: analysis.shareToken
    });
  } catch (error) {
    console.error('Erro ao alterar visibilidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/analysis/share/:token - Acessar análise pública via token
router.get('/share/:token', async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      shareToken: req.params.token,
      isPublic: true,
      status: 'completed'
    }).populate('user', 'name');

    if (!analysis) {
      return res.status(404).json({
        error: 'Análise não encontrada ou não disponível'
      });
    }

    res.json({
      analysis: {
        id: analysis._id,
        status: analysis.status,
        plan: analysis.plan,
        createdAt: analysis.createdAt,
        user: {
          name: analysis.user.name
        },
        result: analysis.result,
        isPublic: true
      }
    });
  } catch (error) {
    console.error('Erro ao acessar análise pública:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
