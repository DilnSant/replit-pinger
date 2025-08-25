
#!/usr/bin/env node

const axios = require('axios');

const APP_URL = 'https://b11959b9-296f-4b48-a6a9-962290608715-00-2aki85zt5f42b.kirk.replit.dev';
const HEALTH_URL = `${APP_URL}/health`;

async function checkAppStatus() {
  console.log('🔍 Verificando status da aplicação...\n');
  
  try {
    // Teste 1: Endpoint principal
    console.log('📍 Testando endpoint principal...');
    const mainResponse = await axios.get(APP_URL, { 
      timeout: 10000,
      headers: { 'User-Agent': 'UptimeRobot-Test' }
    });
    console.log(`✅ Endpoint principal: Status ${mainResponse.status}`);
    
    // Teste 2: Health check
    console.log('\n📍 Testando health check...');
    const healthResponse = await axios.get(HEALTH_URL, { 
      timeout: 10000,
      headers: { 'User-Agent': 'UptimeRobot-Test' }
    });
    console.log(`✅ Health check: Status ${healthResponse.status}`);
    console.log(`📊 Response time: ${healthResponse.data.responseTime}`);
    console.log(`🗄️  Supabase: ${healthResponse.data.supabase}`);
    
    console.log('\n🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
    console.log('\n📋 INSTRUÇÕES PARA O UPTIMEROBOT:');
    console.log(`URL para monitorar: ${APP_URL}`);
    console.log(`URL alternativa (health): ${HEALTH_URL}`);
    console.log('Intervalo recomendado: 5 minutos');
    console.log('Timeout recomendado: 30 segundos');
    
  } catch (error) {
    console.error('❌ ERRO na verificação:', error.message);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.log('\n⚠️  AÇÕES NECESSÁRIAS:');
    console.log('1. Verificar se o app está rodando');
    console.log('2. Verificar conexão Supabase');
    console.log('3. Atualizar URL no UptimeRobot se necessário');
    
    process.exit(1);
  }
}

// Executar verificação
checkAppStatus();
