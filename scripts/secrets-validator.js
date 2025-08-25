
class SecretsValidator {
  constructor() {
    this.requiredSecrets = {
      'DATABASE_URL': {
        description: 'URL de conexão com PostgreSQL (Neon DB ou Supabase)',
        example: 'postgresql://user:password@host:port/database',
        required: true
      },
      'SESSION_SECRET': {
        description: 'Chave secreta para sessões JWT',
        example: 'uma-string-aleatoria-muito-segura',
        required: true
      },
      'SUPABASE_URL': {
        description: 'URL do projeto Supabase',
        example: 'https://your-project.supabase.co',
        required: false
      },
      'SUPABASE_ANON_KEY': {
        description: 'Chave anônima do Supabase',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: false
      },
      'SUPABASE_SERVICE_ROLE_KEY': {
        description: 'Chave de service role do Supabase',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: false
      }
    };
  }

  validateSecrets() {
    console.log('🔍 Validando configuração de secrets...\n');
    
    const results = {
      valid: true,
      missing: [],
      present: [],
      issues: []
    };

    for (const [key, config] of Object.entries(this.requiredSecrets)) {
      const value = process.env[key];
      
      if (!value) {
        if (config.required) {
          results.missing.push(key);
          results.valid = false;
          console.log(`❌ ${key}: AUSENTE (OBRIGATÓRIO)`);
          console.log(`   ${config.description}`);
          console.log(`   Exemplo: ${config.example}\n`);
        } else {
          console.log(`⚠️  ${key}: Ausente (opcional)`);
          console.log(`   ${config.description}\n`);
        }
      } else {
        results.present.push(key);
        console.log(`✅ ${key}: Presente`);
        
        // Validações específicas
        if (key === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
          results.issues.push(`${key}: Formato inválido - deve começar com 'postgresql://'`);
          console.log(`   ⚠️  Formato pode estar incorreto`);
        }
        
        if (key.includes('SUPABASE_URL') && !value.startsWith('https://')) {
          results.issues.push(`${key}: Deve ser uma URL HTTPS válida`);
          console.log(`   ⚠️  Deve ser uma URL HTTPS válida`);
        }
        
        console.log('');
      }
    }

    return results;
  }

  generateSecretsGuide() {
    console.log('\n📋 GUIA DE CONFIGURAÇÃO DE SECRETS');
    console.log('=====================================\n');
    
    console.log('Para adicionar/editar secrets no Replit:');
    console.log('1. Abra a aba "Tools" → "Secrets"');
    console.log('2. Clique em "+ New Secret"');
    console.log('3. Adicione cada secret conforme abaixo:\n');

    for (const [key, config] of Object.entries(this.requiredSecrets)) {
      console.log(`🔑 ${key}${config.required ? ' (OBRIGATÓRIO)' : ' (OPCIONAL)'}`);
      console.log(`   ${config.description}`);
      console.log(`   Exemplo: ${config.example}\n`);
    }

    console.log('💡 DICAS:');
    console.log('- Para DATABASE_URL: Use a string de conexão do seu banco PostgreSQL');
    console.log('- Para SESSION_SECRET: Gere uma string aleatória de pelo menos 32 caracteres');
    console.log('- Secrets do Supabase: Encontre no dashboard do seu projeto Supabase');
  }

  testDatabaseConnection() {
    console.log('🔌 Testando conexão com banco de dados...\n');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('❌ DATABASE_URL não configurada');
      return false;
    }

    try {
      // Parse da URL para verificar formato
      const url = new URL(databaseUrl);
      console.log(`✅ URL válida detectada:`);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port || '5432'}`);
      console.log(`   Database: ${url.pathname.slice(1)}`);
      console.log(`   User: ${url.username}`);
      return true;
    } catch (error) {
      console.log(`❌ Formato de URL inválido: ${error.message}`);
      return false;
    }
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  const validator = new SecretsValidator();
  
  console.log('🔧 VALIDADOR DE SECRETS - BRANDNESS APP\n');
  
  const results = validator.validateSecrets();
  
  console.log('\n📊 RESUMO DA VALIDAÇÃO');
  console.log('=======================');
  console.log(`✅ Secrets presentes: ${results.present.length}`);
  console.log(`❌ Secrets ausentes: ${results.missing.length}`);
  console.log(`⚠️  Problemas detectados: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n🚨 PROBLEMAS DETECTADOS:');
    results.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (!results.valid) {
    console.log('\n❌ CONFIGURAÇÃO INCOMPLETA');
    validator.generateSecretsGuide();
  } else {
    console.log('\n✅ CONFIGURAÇÃO VÁLIDA');
    validator.testDatabaseConnection();
  }
}

module.exports = SecretsValidator;
