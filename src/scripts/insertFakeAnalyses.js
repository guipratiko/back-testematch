const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
require('dotenv').config();

const userId = '68e85accf7d148a1d1b2f178';

const fakeAnalyses = [
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-1.jpg',
    imageId: 'fake_image_1',
    status: 'completed',
    creditsUsed: 1,
    plan: 'basic',
    result: {
      mbti: 'ENFJ',
      personalityTraits: ['Carismático', 'Empático', 'Comunicativo'],
      loveStyle: 'Romântico e atencioso',
      redFlags: ['Pode ser muito emotivo', 'Evita conflitos'],
      strengths: ['Excelente comunicação', 'Muito romântico', 'Dedicado'],
      weaknesses: ['Muito sensível', 'Precisa de validação'],
      compatibility: {
        passionScore: 85,
        idealColor: 'Vermelho',
        idealMatch: 'INFP'
      },
      celebrities: {
        brazilian: {
          name: 'Ivete Sangalo',
          similarity: 88,
          description: 'Energia contagiante e carisma'
        },
        international: {
          name: 'Oprah Winfrey',
          similarity: 90,
          description: 'Empatia e comunicação'
        }
      },
      tips: ['Seja autêntico', 'Ouça ativamente', 'Valorize pequenos gestos'],
      conversationScripts: ['Como foi seu dia?', 'O que te faz feliz?'],
      infographicUrl: 'https://fake-url.com/infographic1.png'
    },
    processingTime: 5,
    isPublic: false
  },
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-2.jpg',
    imageId: 'fake_image_2',
    status: 'completed',
    creditsUsed: 1,
    plan: 'complete',
    result: {
      mbti: 'INTJ',
      personalityTraits: ['Estratégico', 'Independente', 'Analítico'],
      loveStyle: 'Racional e leal',
      redFlags: ['Distante emocionalmente', 'Muito crítico'],
      strengths: ['Planejador', 'Leal', 'Inteligente'],
      weaknesses: ['Frio às vezes', 'Dificuldade em expressar emoções'],
      compatibility: {
        passionScore: 78,
        idealColor: 'Azul',
        idealMatch: 'ENFP'
      },
      celebrities: {
        brazilian: {
          name: 'Luciano Huck',
          similarity: 82,
          description: 'Estratégico e visionário'
        },
        international: {
          name: 'Elon Musk',
          similarity: 85,
          description: 'Pensamento estratégico'
        }
      },
      tips: ['Demonstre afeto', 'Seja direto', 'Planeje encontros'],
      conversationScripts: ['Vamos planejar algo?', 'O que você acha?'],
      infographicUrl: 'https://fake-url.com/infographic2.png'
    },
    processingTime: 4,
    isPublic: false
  },
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-3.jpg',
    imageId: 'fake_image_3',
    status: 'completed',
    creditsUsed: 1,
    plan: 'basic',
    result: {
      mbti: 'ESFP',
      personalityTraits: ['Espontâneo', 'Divertido', 'Social'],
      loveStyle: 'Aventureiro e divertido',
      redFlags: ['Impulsivo', 'Foge de compromissos'],
      strengths: ['Carismático', 'Alegre', 'Presente'],
      weaknesses: ['Imediatista', 'Evita planos de longo prazo'],
      compatibility: {
        passionScore: 92,
        idealColor: 'Laranja',
        idealMatch: 'ISFJ'
      },
      celebrities: {
        brazilian: {
          name: 'Anitta',
          similarity: 91,
          description: 'Energia e espontaneidade'
        },
        international: {
          name: 'Miley Cyrus',
          similarity: 89,
          description: 'Autenticidade e diversão'
        }
      },
      tips: ['Seja espontâneo', 'Crie memórias', 'Divirta-se juntos'],
      conversationScripts: ['Bora fazer algo diferente?', 'Que tal uma aventura?'],
      infographicUrl: 'https://fake-url.com/infographic3.png'
    },
    processingTime: 6,
    isPublic: true
  },
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-4.jpg',
    imageId: 'fake_image_4',
    status: 'completed',
    creditsUsed: 1,
    plan: 'complete',
    result: {
      mbti: 'INFP',
      personalityTraits: ['Idealista', 'Criativo', 'Sensível'],
      loveStyle: 'Profundo e autêntico',
      redFlags: ['Muito sensível', 'Idealiza demais'],
      strengths: ['Autêntico', 'Romântico', 'Compreensivo'],
      weaknesses: ['Muito emotivo', 'Sonhador'],
      compatibility: {
        passionScore: 88,
        idealColor: 'Roxo',
        idealMatch: 'ENFJ'
      },
      celebrities: {
        brazilian: {
          name: 'Caetano Veloso',
          similarity: 86,
          description: 'Sensibilidade artística'
        },
        international: {
          name: 'Johnny Depp',
          similarity: 84,
          description: 'Criatividade e profundidade'
        }
      },
      tips: ['Seja autêntico', 'Compartilhe sonhos', 'Valorize momentos'],
      conversationScripts: ['O que te inspira?', 'Vamos sonhar juntos?'],
      infographicUrl: 'https://fake-url.com/infographic4.png'
    },
    processingTime: 5,
    isPublic: false
  },
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-5.jpg',
    imageId: 'fake_image_5',
    status: 'processing',
    creditsUsed: 1,
    plan: 'basic',
    processingTime: null,
    isPublic: false
  },
  {
    user: userId,
    imageUrl: 'https://cloudinary.com/fake-image-6.jpg',
    imageId: 'fake_image_6',
    status: 'completed',
    creditsUsed: 1,
    plan: 'basic',
    result: {
      mbti: 'ESTP',
      personalityTraits: ['Energético', 'Prático', 'Ousado'],
      loveStyle: 'Aventureiro e direto',
      redFlags: ['Impaciente', 'Busca adrenalina'],
      strengths: ['Confiante', 'Divertido', 'Prático'],
      weaknesses: ['Impulsivo', 'Evita profundidade emocional'],
      compatibility: {
        passionScore: 95,
        idealColor: 'Vermelho',
        idealMatch: 'ISFP'
      },
      celebrities: {
        brazilian: {
          name: 'Neymar Jr',
          similarity: 93,
          description: 'Ousadia e energia'
        },
        international: {
          name: 'Tom Cruise',
          similarity: 91,
          description: 'Ação e aventura'
        }
      },
      tips: ['Mantenha a emoção', 'Seja direto', 'Surpreenda'],
      conversationScripts: ['Vamos fazer algo radical?', 'Topa um desafio?'],
      infographicUrl: 'https://fake-url.com/infographic5.png'
    },
    processingTime: 4,
    isPublic: false
  }
];

async function insertFakeAnalyses() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Verificar se o usuário existe
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      process.exit(1);
    }

    console.log('👤 Usuário encontrado:', user.name);
    console.log('📧 Email:', user.email);

    // Deletar análises antigas deste usuário (opcional)
    const deleted = await Analysis.deleteMany({ user: userId });
    console.log(`🗑️  Removidas ${deleted.deletedCount} análises antigas`);

    // Inserir novas análises
    const analyses = await Analysis.insertMany(fakeAnalyses);
    
    console.log(`\n✅ ${analyses.length} análises fictícias inseridas com sucesso!`);
    console.log('\n📊 Resumo:');
    console.log(`   Total: ${analyses.length}`);
    console.log(`   Concluídas: ${analyses.filter(a => a.status === 'completed').length}`);
    console.log(`   Processando: ${analyses.filter(a => a.status === 'processing').length}`);
    console.log(`   Taxa de sucesso: ${Math.round((analyses.filter(a => a.status === 'completed').length / analyses.length) * 100)}%`);

    console.log('\n🎯 Acesse o dashboard em:');
    console.log(`   http://localhost:3750/dashboard`);

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

insertFakeAnalyses();

