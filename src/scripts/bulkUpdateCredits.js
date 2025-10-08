const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function bulkUpdateCredits() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // ============================================
    // EXEMPLOS DE ATUALIZAÇÃO EM MASSA
    // ============================================

    console.log('📋 Escolha uma opção:\n');
    console.log('1. Adicionar créditos a todos os usuários');
    console.log('2. Definir créditos específicos para todos');
    console.log('3. Atualizar usuários por plano');
    console.log('4. Adicionar créditos aos usuários com créditos baixos\n');

    // ============================================
    // OPÇÃO 1: Adicionar créditos a todos
    // ============================================
    const addToAll = async (credits) => {
      const result = await User.updateMany(
        {}, // Todos os usuários
        { $inc: { credits: credits } }
      );
      console.log(`✅ ${result.modifiedCount} usuários atualizados`);
      console.log(`   Adicionados ${credits} créditos a cada um\n`);
    };

    // ============================================
    // OPÇÃO 2: Definir créditos específicos para todos
    // ============================================
    const setForAll = async (credits) => {
      const result = await User.updateMany(
        {}, // Todos os usuários
        { $set: { credits: credits } }
      );
      console.log(`✅ ${result.modifiedCount} usuários atualizados`);
      console.log(`   Todos agora têm ${credits} créditos\n`);
    };

    // ============================================
    // OPÇÃO 3: Atualizar por plano
    // ============================================
    const updateByPlan = async (plan, credits) => {
      const result = await User.updateMany(
        { plan: plan }, // Usuários do plano específico
        { $set: { credits: credits } }
      );
      console.log(`✅ ${result.modifiedCount} usuários do plano "${plan}" atualizados`);
      console.log(`   Todos agora têm ${credits} créditos\n`);
    };

    // ============================================
    // OPÇÃO 4: Adicionar créditos a usuários com créditos baixos
    // ============================================
    const updateLowCredits = async (threshold, creditsToAdd) => {
      const result = await User.updateMany(
        { credits: { $lt: threshold } }, // Créditos menores que threshold
        { $inc: { credits: creditsToAdd } }
      );
      console.log(`✅ ${result.modifiedCount} usuários com menos de ${threshold} créditos atualizados`);
      console.log(`   Adicionados ${creditsToAdd} créditos a cada um\n`);
    };

    // ============================================
    // ATUALIZAÇÃO POR EMAIL (Lista)
    // ============================================
    const updateByEmails = async (emails, credits) => {
      const result = await User.updateMany(
        { email: { $in: emails } }, // Lista de emails
        { $set: { credits: credits } }
      );
      console.log(`✅ ${result.modifiedCount} usuários atualizados da lista`);
      console.log(`   Todos agora têm ${credits} créditos\n`);
    };

    // ============================================
    // EXECUTE A OPERAÇÃO DESEJADA AQUI
    // ============================================

    // EXEMPLO 1: Adicionar 1000 créditos a todos
    // await addToAll(1000);

    // EXEMPLO 2: Definir 5000 créditos para todos
    // await setForAll(5000);

    // EXEMPLO 3: Atualizar usuários do plano 'basic'
    // await updateByPlan('basic', 1000);

    // EXEMPLO 4: Adicionar 500 créditos a quem tem menos de 100
    // await updateLowCredits(100, 500);

    // EXEMPLO 5: Atualizar lista específica de emails
    // await updateByEmails(['user1@email.com', 'user2@email.com'], 3000);

    // EXEMPLO 6: Listar usuários antes de atualizar
    console.log('📋 Usuários atuais:\n');
    const users = await User.find({}).select('name email credits plan');
    users.forEach(user => {
      console.log(`   ${user.name} (${user.email}): ${user.credits} créditos - Plano: ${user.plan}`);
    });
    console.log('');

    // DESCOMENTE A LINHA ABAIXO E ESCOLHA UMA DAS OPÇÕES ACIMA
    console.log('⚠️  Nenhuma atualização foi executada. Descomente uma das opções acima no script.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

bulkUpdateCredits();
