const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

async function checkPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');
    
    const plans = await Plan.find({}).sort({ sortOrder: 1 });
    console.log('\n📋 Planos no banco de dados:');
    
    plans.forEach(plan => {
      console.log(`- ${plan.name} (${plan.type}): R$ ${plan.price} - ${plan.credits} créditos`);
      console.log(`  Descrição: ${plan.description}`);
      console.log(`  Features: ${plan.features.join(', ')}`);
      console.log(`  Desconto: ${plan.discount.percentage}%`);
      console.log(`  Ativo: ${plan.isActive}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkPlans();
