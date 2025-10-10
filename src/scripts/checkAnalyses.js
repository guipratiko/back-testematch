const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
require('dotenv').config();

const userId = '68e85accf7d148a1d1b2f178';

async function checkAnalyses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    const count = await Analysis.countDocuments({ user: userId });
    const analyses = await Analysis.find({ user: userId })
      .select('status plan createdAt')
      .sort({ createdAt: -1 });

    console.log(`📊 Total de análises: ${count}\n`);
    
    analyses.forEach((a, i) => {
      console.log(`${i+1}. Status: ${a.status}, Plan: ${a.plan}, Data: ${a.createdAt}`);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAnalyses();

