const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserCredits() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // ============================================
    // CONFIGURAÇÕES - EDITE AQUI
    // ============================================
    
    const userEmail = 'teste@email.com'; // Email do usuário
    const creditsToAdd = 1000; // Créditos a adicionar (use negativo para remover)
    const setCredits = null; // Ou defina um valor específico (ex: 5000)
    
    // ============================================
    
    // Buscar usuário
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ Usuário com email "${userEmail}" não encontrado`);
      process.exit(1);
    }
    
    console.log('📊 Dados do usuário:');
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Créditos Atuais: ${user.credits}\n`);
    
    // Atualizar créditos
    if (setCredits !== null) {
      // Define um valor específico
      user.credits = setCredits;
      console.log(`💳 Definindo créditos para: ${setCredits}`);
    } else {
      // Adiciona ou remove créditos
      user.credits += creditsToAdd;
      console.log(`💳 ${creditsToAdd > 0 ? 'Adicionando' : 'Removendo'} ${Math.abs(creditsToAdd)} créditos`);
    }
    
    await user.save();
    
    console.log(`✅ Créditos atualizados com sucesso!`);
    console.log(`   Créditos Finais: ${user.credits}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// ============================================
// EXEMPLOS DE USO
// ============================================

// Exemplo 1: Adicionar 1000 créditos
// const creditsToAdd = 1000;
// const setCredits = null;

// Exemplo 2: Remover 500 créditos
// const creditsToAdd = -500;
// const setCredits = null;

// Exemplo 3: Definir exatamente 5000 créditos
// const creditsToAdd = 0;
// const setCredits = 5000;

updateUserCredits();
