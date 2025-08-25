
const fs = require('fs');
const { execSync } = require('child_process');

class SystemDiagnostics {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  async runFullDiagnostics() {
    console.log('🔍 Iniciando diagnóstico completo do sistema...\n');
    
    await this.checkFileStructure();
    await this.checkDependencies();
    await this.checkDatabaseConnection();
    await this.checkServerConfiguration();
    await this.checkFrontendConfiguration();
    
    return this.generateReport();
  }

  async checkFileStructure() {
    console.log('📁 Verificando estrutura de arquivos...');
    
    const criticalFiles = [
      'server/index.ts',
      'server/routes.ts',
      'server/db.ts',
      'client/src/App.tsx',
      'client/src/main.tsx',
      'shared/schema.ts',
      'package.json',
      'tsconfig.json'
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        this.issues.push(`Arquivo crítico ausente: ${file}`);
        console.log(`❌ ${file}: AUSENTE`);
      } else {
        console.log(`✅ ${file}: OK`);
      }
    }
  }

  async checkDependencies() {
    console.log('\n📦 Verificando dependências...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Verificar dependências críticas
      const criticalDeps = [
        'express',
        'react',
        'drizzle-orm',
        '@neondatabase/serverless',
        'bcryptjs',
        'jsonwebtoken'
      ];

      for (const dep of criticalDeps) {
        if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
          console.log(`✅ ${dep}: Instalado`);
        } else {
          this.issues.push(`Dependência crítica ausente: ${dep}`);
          console.log(`❌ ${dep}: AUSENTE`);
        }
      }

      // Verificar node_modules
      if (!fs.existsSync('node_modules')) {
        this.issues.push('Pasta node_modules não encontrada');
        this.fixes.push('Executar: npm install');
        console.log(`❌ node_modules: AUSENTE`);
      } else {
        console.log(`✅ node_modules: OK`);
      }

    } catch (error) {
      this.issues.push('Erro ao ler package.json');
      console.log(`❌ package.json: ERRO - ${error.message}`);
    }
  }

  async checkDatabaseConnection() {
    console.log('\n🗄️  Verificando configuração do banco de dados...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.issues.push('DATABASE_URL não configurada');
      this.fixes.push('Configurar DATABASE_URL nas secrets');
      console.log(`❌ DATABASE_URL: NÃO CONFIGURADA`);
      return;
    }

    try {
      const url = new URL(databaseUrl);
      console.log(`✅ DATABASE_URL: Formato válido`);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port || '5432'}`);
      
      // Verificar se é localhost (problema comum)
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        this.issues.push('DATABASE_URL aponta para localhost - pode não funcionar no Replit');
        this.fixes.push('Verificar se deve usar um banco de dados externo (Neon, Supabase, etc.)');
        console.log(`⚠️  Host localhost detectado - pode ser problemático`);
      }
      
    } catch (error) {
      this.issues.push(`DATABASE_URL com formato inválido: ${error.message}`);
      this.fixes.push('Corrigir formato da DATABASE_URL');
      console.log(`❌ DATABASE_URL: FORMATO INVÁLIDO`);
    }
  }

  async checkServerConfiguration() {
    console.log('\n🖥️  Verificando configuração do servidor...');
    
    try {
      if (fs.existsSync('server/index.ts')) {
        const serverContent = fs.readFileSync('server/index.ts', 'utf8');
        
        // Verificar porta
        if (serverContent.includes('5000')) {
          console.log(`✅ Porta 5000: Configurada`);
        } else {
          this.issues.push('Porta 5000 não encontrada na configuração');
          console.log(`⚠️  Porta 5000: Não detectada`);
        }

        // Verificar CORS
        if (serverContent.includes('cors')) {
          console.log(`✅ CORS: Configurado`);
        } else {
          this.issues.push('Configuração CORS não detectada');
          console.log(`⚠️  CORS: Não detectado`);
        }

        // Verificar middleware de sessão
        if (serverContent.includes('session')) {
          console.log(`✅ Session middleware: Configurado`);
        } else {
          this.issues.push('Session middleware não detectado');
          console.log(`⚠️  Session: Não detectado`);
        }
      }
    } catch (error) {
      this.issues.push(`Erro ao verificar server/index.ts: ${error.message}`);
    }
  }

  async checkFrontendConfiguration() {
    console.log('\n🎨 Verificando configuração do frontend...');
    
    try {
      if (fs.existsSync('client/src/main.tsx')) {
        console.log(`✅ main.tsx: Existe`);
      }

      if (fs.existsSync('client/src/App.tsx')) {
        console.log(`✅ App.tsx: Existe`);
      }

      if (fs.existsSync('vite.config.ts')) {
        const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
        if (viteConfig.includes('5000')) {
          console.log(`✅ Vite proxy: Configurado para porta 5000`);
        } else {
          this.issues.push('Vite proxy não configurado para porta 5000');
          console.log(`⚠️  Vite proxy: Não configurado`);
        }
      }

    } catch (error) {
      this.issues.push(`Erro ao verificar frontend: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📋 RELATÓRIO DE DIAGNÓSTICO');
    console.log('============================\n');
    
    console.log(`📊 RESUMO:`);
    console.log(`   Problemas encontrados: ${this.issues.length}`);
    console.log(`   Correções sugeridas: ${this.fixes.length}\n`);

    if (this.issues.length > 0) {
      console.log(`🚨 PROBLEMAS DETECTADOS:`);
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (this.fixes.length > 0) {
      console.log(`🔧 CORREÇÕES SUGERIDAS:`);
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
      console.log('');
    }

    if (this.issues.length === 0) {
      console.log(`✅ SISTEMA SAUDÁVEL - Nenhum problema crítico detectado`);
    }

    return {
      issues: this.issues,
      fixes: this.fixes,
      healthy: this.issues.length === 0
    };
  }

  async autoFix() {
    console.log('\n🔧 Iniciando correções automáticas...\n');
    
    // Instalar dependências se node_modules não existir
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Instalando dependências...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependências instaladas');
      } catch (error) {
        console.log('❌ Erro ao instalar dependências:', error.message);
      }
    }

    // Outras correções automáticas podem ser adicionadas aqui
    
    console.log('\n✅ Correções automáticas concluídas');
  }
}

// Executar diagnóstico se chamado diretamente
if (require.main === module) {
  const diagnostics = new SystemDiagnostics();
  
  diagnostics.runFullDiagnostics()
    .then(report => {
      if (!report.healthy) {
        console.log('\n🔧 Deseja executar correções automáticas? (y/n)');
        // Aqui você pode adicionar lógica para entrada do usuário
        // Por enquanto, vamos apenas mostrar o relatório
      }
    })
    .catch(error => {
      console.error('💥 Erro durante o diagnóstico:', error);
    });
}

module.exports = SystemDiagnostics;
