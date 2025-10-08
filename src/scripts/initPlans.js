const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

const plans = [
  {
    name: 'Plano Básico',
    type: 'basic',
    price: 29.9,
    credits: 1000,
    description: 'Relatório com MBTI + 1 celeb lookalike + 2 dicas de conversa',
    features: [
      'Análise MBTI completa',
      '1 celebridade lookalike',
      '2 dicas de conversa personalizadas'
    ],
    isActive: true,
    sortOrder: 1,
    discount: {
      percentage: 0
    }
  },
  {
    name: 'Plano Completo',
    type: 'complete',
    price: 59.9,
    credits: 3000,
    description: 'Relatório full com múltiplas celebs variadas + scores preditivos + 3 scripts personalizados + infográfico PDF',
    features: [
      'Análise MBTI completa',
      'Múltiplas celebridades variadas',
      'Scores preditivos de compatibilidade',
      '3 scripts de conversa personalizados',
      'Infográfico PDF compartilhável'
    ],
    isActive: true,
    sortOrder: 2,
    discount: {
      percentage: 0
    }
  },
  {
    name: 'Pacote de Créditos',
    type: 'credits_pack',
    price: 99,
    credits: 5000,
    description: '5000 créditos por R$99 (desconto 20% – ideal para análises recorrentes ou de casal)',
    features: [
      '5000 créditos para análises',
      'Desconto de 20%',
      'Ideal para casais',
      'Análises recorrentes'
    ],
    isActive: true,
    sortOrder: 3,
    discount: {
      percentage: 20
    }
  }
];

async function initializePlans() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ Conectado ao MongoDB');

    // Limpar planos existentes
    await Plan.deleteMany({});
    console.log('🗑️ Planos existentes removidos');

    // Inserir novos planos
    const createdPlans = await Plan.insertMany(plans);
    console.log('✅ Planos criados:', createdPlans.length);

    // Listar planos criados
    console.log('\n📋 Planos disponíveis:');
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: R$ ${plan.price} (${plan.credits} créditos)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar planos:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializePlans();
}

module.exports = initializePlans;
