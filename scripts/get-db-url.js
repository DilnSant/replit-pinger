
#!/usr/bin/env node
require('dotenv').config();

function getPostgresUrl() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  console.log('🔍 Extraindo URLs de conexão PostgreSQL...\n');

  // Se você tem DATABASE_URL configurada (Replit PostgreSQL)
  if (databaseUrl) {
    console.log('📊 URL do Replit PostgreSQL:');
    console.log(databaseUrl);
    console.log('');
  }

  // Se você tem Supabase configurado
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const url = new URL(supabaseUrl);
      const host = url.hostname;
      const projectRef = host.split('.')[0];
      
      // URL de conexão direta ao PostgreSQL do Supabase
      const directUrl = `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;
      
      // URL de conexão via pooler (recomendada para produção)
      const poolerUrl = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
      
      console.log('📊 URLs do Supabase PostgreSQL:');
      console.log('');
      console.log('🔗 Conexão Direta (porta 5432):');
      console.log(directUrl);
      console.log('');
      console.log('🔗 Connection Pooler (porta 6543) - RECOMENDADA:');
      console.log(poolerUrl);
      console.log('');
      
      // Informações de conexão separadas
      console.log('📋 Parâmetros de conexão:');
      console.log(`Host: db.${projectRef}.supabase.co`);
      console.log(`Port: 5432 (direto) ou 6543 (pooler)`);
      console.log(`Database: postgres`);
      console.log(`User: postgres`);
      console.log(`Password: ${supabaseServiceKey.substring(0, 20)}...`);
      
    } catch (error) {
      console.error('❌ Erro ao processar URL do Supabase:', error.message);
    }
  }

  if (!databaseUrl && (!supabaseUrl || !supabaseServiceKey)) {
    console.log('❌ Nenhuma configuração de banco encontrada');
    console.log('Configure DATABASE_URL ou SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  }
}

getPostgresUrl();
