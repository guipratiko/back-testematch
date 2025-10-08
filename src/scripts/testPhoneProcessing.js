const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testPhoneProcessing() {
  try {
    console.log('🧪 Testando processamento de telefones:\n');

    // Casos de teste
    const testCases = [
      { phone: '62998448536', ddd: '62', expected: '6298448536', description: 'DDD 62 (Goiás) - deve remover o 9' },
      { phone: '11999884455', ddd: '11', expected: '11999884455', description: 'DDD 11 (São Paulo) - deve manter o 9' },
      { phone: '16999884455', ddd: '16', expected: '16999884455', description: 'DDD 16 (São Paulo) - deve manter o 9' },
      { phone: '85999884455', ddd: '85', expected: '8599884455', description: 'DDD 85 (Ceará) - deve remover o 9' },
      { phone: '21999884455', ddd: '21', expected: '2199884455', description: 'DDD 21 (Rio de Janeiro) - deve remover o 9' }
    ];

    for (const testCase of testCases) {
      console.log(`📱 ${testCase.description}`);
      console.log(`   Entrada: ${testCase.phone}`);
      
      // Executar a lógica de processamento do telefone
      const saoPauloDDDs = ['11', '12', '13', '14', '15', '16', '17', '18', '19'];
      const cleanPhone = testCase.phone.replace(/\D/g, '');
      
      let processedPhone = cleanPhone;
      
      if (cleanPhone.length === 11) {
        const ddd = cleanPhone.substring(0, 2);
        
        if (!saoPauloDDDs.includes(ddd)) {
          // Remove o 9 do início do número (posição 2)
          processedPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
        } else {
          // Mantém o telefone como está para DDDs de São Paulo
          processedPhone = cleanPhone;
        }
      }

      console.log(`   Resultado: ${processedPhone}`);
      console.log(`   Esperado: ${testCase.expected}`);
      console.log(`   ✅ ${processedPhone === testCase.expected ? 'CORRETO' : 'INCORRETO'}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testPhoneProcessing();
