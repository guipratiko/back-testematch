const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const userId = '68e85accf7d148a1d1b2f178';

const exampleLLMResponses = [
  `Olá Guilherme! 👋 Sua análise MBTI está pronta. Você é do tipo ENFJ (Protagonista). 
  
  Características principais:
  - Você é naturalmente carismático e empático
  - Tem facilidade para liderar e inspirar pessoas
  - Valoriza relacionamentos profundos e autênticos
  
  No amor: Você tende a ser muito romântico e atencioso, sempre buscando fazer o parceiro feliz.`,
  
  `💡 Dicas personalizadas para você:
  
  1. Comunicação: Seu tipo valoriza conversas profundas. Não tenha medo de compartilhar seus sentimentos.
  2. Compatibilidade: Você combina muito bem com INFP e ISFP - tipos que valorizam autenticidade.
  3. Red Flag: Cuidado com pessoas muito críticas ou distantes emocionalmente, isso pode te magoar.`,
  
  `🌟 Você é compatível com celebridades como:
  
  🇧🇷 Brasileiras: Ivete Sangalo (88% compatibilidade)
  🌎 Internacionais: Oprah Winfrey (90% compatibilidade)
  
  Ambas compartilham sua energia contagiante e habilidade de conectar com pessoas!`
];

async function insertLLMResponses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      process.exit(1);
    }

    console.log('👤 Usuário encontrado:', user.name);
    console.log('📧 Email:', user.email);
    console.log('💳 Créditos:', user.credits);
    console.log('📦 Plan:', user.plan);

    // Inserir respostas LLM
    user.llmResponses = exampleLLMResponses;
    await user.save();

    console.log('\n✅ Respostas LLM inseridas com sucesso!');
    console.log(`📝 Total de respostas: ${exampleLLMResponses.length}`);
    
    console.log('\n📋 Respostas inseridas:');
    exampleLLMResponses.forEach((response, index) => {
      const preview = response.substring(0, 80).replace(/\n/g, ' ');
      console.log(`   ${index + 1}. ${preview}...`);
    });

    // Verificar o resultado
    const updatedUser = await User.findById(userId).select('llmResponses');
    console.log('\n🔍 Verificação - Total no banco:', updatedUser.llmResponses.length);

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

insertLLMResponses();

