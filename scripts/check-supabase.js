
#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabaseConnection() {
  console.log('🔍 Verificando configuração do Supabase...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const viteSupabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const viteSupabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

  console.log('📋 Variáveis de ambiente:');
  console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Definida (' + supabaseUrl.substring(0, 30) + '...)' : '❌ Não definida'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Definida (***...)' : '❌ Não definida'}`);
  console.log(`SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Definida (***...)' : '❌ Não definida'}`);
  console.log(`VITE_SUPABASE_URL: ${viteSupabaseUrl ? '✅ Definida (' + viteSupabaseUrl.substring(0, 30) + '...)' : '❌ Não definida'}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${viteSupabaseAnonKey ? '✅ Definida (***...)' : '❌ Não definida'}`);
  console.log('');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    console.log('');
    console.log('🔧 Para corrigir:');
    console.log('1. Acesse o painel do Supabase (https://supabase.com/dashboard)');
    console.log('2. Vá em Settings > API');
    console.log('3. Copie a URL do projeto e a service_role key');
    console.log('4. Configure as variáveis no Secrets do Replit');
    return false;
  }

  try {
    // Test backend connection (service role)
    console.log('🔄 Testando conexão do backend (service role)...');
    const supabaseBackend = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: services, error: servicesError } = await supabaseBackend
      .from('services')
      .select('id')
      .limit(1);

    if (servicesError) {
      console.log('❌ Erro na conexão do backend:', servicesError.message);
      return false;
    }

    console.log('✅ Conexão do backend funcionando');

    // Test frontend connection (anon key)
    if (supabaseAnonKey) {
      console.log('🔄 Testando conexão do frontend (anon key)...');
      const supabaseFrontend = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: users, error: usersError } = await supabaseFrontend
        .from('users')
        .select('id')
        .limit(1);

      if (usersError) {
        console.log('⚠️ Aviso na conexão do frontend:', usersError.message);
      } else {
        console.log('✅ Conexão do frontend funcionando');
      }
    }

    console.log('');
    console.log('🎉 Supabase está configurado corretamente!');
    return true;

  } catch (error) {
    console.log('❌ Erro ao testar conexão:', error.message);
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('1. Verifique se as credenciais estão corretas');
    console.log('2. Verifique se o projeto Supabase está ativo');
    console.log('3. Verifique se as tabelas existem no banco');
    return false;
  }
}

checkSupabaseConnection();
