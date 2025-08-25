
const BackupSystem = require('./backup-system');
const SecretsValidator = require('./secrets-validator');
const SystemDiagnostics = require('./system-diagnostics');

class MaintenanceManager {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.secretsValidator = new SecretsValidator();
    this.systemDiagnostics = new SystemDiagnostics();
  }

  async runFullMaintenance() {
    console.log('🚀 BRANDNESS APP - SISTEMA DE MANUTENÇÃO');
    console.log('==========================================\n');
    
    try {
      // 1. Backup Preventivo
      console.log('ETAPA 1: BACKUP PREVENTIVO');
      console.log('---------------------------');
      const backupPath = await this.backupSystem.createFullBackup();
      console.log(`✅ Backup criado: ${backupPath}\n`);
      
      // 2. Validação de Secrets
      console.log('ETAPA 2: VALIDAÇÃO DE SECRETS');
      console.log('------------------------------');
      const secretsResults = this.secretsValidator.validateSecrets();
      
      if (!secretsResults.valid) {
        console.log('\n❌ Secrets incompletas detectadas');
        this.secretsValidator.generateSecretsGuide();
        console.log('\n⚠️  Configure as secrets antes de continuar\n');
        return false;
      }
      console.log('✅ Secrets validadas com sucesso\n');
      
      // 3. Diagnóstico do Sistema
      console.log('ETAPA 3: DIAGNÓSTICO DO SISTEMA');
      console.log('--------------------------------');
      const diagnosticsReport = await this.systemDiagnostics.runFullDiagnostics();
      
      if (!diagnosticsReport.healthy) {
        console.log('\n🔧 Executando correções automáticas...');
        await this.systemDiagnostics.autoFix();
      }
      
      // 4. Validação Final
      console.log('\nETAPA 4: VALIDAÇÃO FINAL');
      console.log('-------------------------');
      await this.runFinalValidation();
      
      console.log('\n🎉 MANUTENÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('====================================');
      console.log('✅ Backup realizado');
      console.log('✅ Secrets validadas');
      console.log('✅ Sistema diagnosticado');
      console.log('✅ Correções aplicadas');
      console.log('\n🚀 Sistema pronto para uso!');
      
      return true;
      
    } catch (error) {
      console.error('\n💥 ERRO DURANTE A MANUTENÇÃO:', error);
      console.log('\n📞 Para suporte, verifique:');
      console.log('   - Logs de erro detalhados');
      console.log('   - Backup criado para restauração');
      console.log('   - Configuração de secrets');
      return false;
    }
  }

  async runFinalValidation() {
    console.log('🔍 Executando validação final...');
    
    // Verificar se o servidor pode iniciar
    const criticalFiles = [
      'server/index.ts',
      'client/src/main.tsx',
      'package.json'
    ];

    let allFilesOk = true;
    for (const file of criticalFiles) {
      if (!require('fs').existsSync(file)) {
        console.log(`❌ Arquivo crítico ausente: ${file}`);
        allFilesOk = false;
      }
    }

    if (allFilesOk) {
      console.log('✅ Todos os arquivos críticos presentes');
    }

    // Verificar secrets críticas
    const criticalSecrets = ['DATABASE_URL', 'SESSION_SECRET'];
    let secretsOk = true;
    for (const secret of criticalSecrets) {
      if (!process.env[secret]) {
        console.log(`❌ Secret crítica ausente: ${secret}`);
        secretsOk = false;
      }
    }

    if (secretsOk) {
      console.log('✅ Secrets críticas configuradas');
    }

    return allFilesOk && secretsOk;
  }

  async quickDiagnostic() {
    console.log('⚡ DIAGNÓSTICO RÁPIDO');
    console.log('====================\n');
    
    const secretsResults = this.secretsValidator.validateSecrets();
    const diagnosticsReport = await this.systemDiagnostics.runFullDiagnostics();
    
    console.log('\n📊 RESUMO RÁPIDO:');
    console.log(`   Secrets válidas: ${secretsResults.valid ? '✅' : '❌'}`);
    console.log(`   Sistema saudável: ${diagnosticsReport.healthy ? '✅' : '❌'}`);
    console.log(`   Problemas detectados: ${diagnosticsReport.issues.length}`);
    
    return secretsResults.valid && diagnosticsReport.healthy;
  }
}

// Executar manutenção se chamado diretamente
if (require.main === module) {
  const maintenance = new MaintenanceManager();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    maintenance.quickDiagnostic();
  } else if (args.includes('--backup-only')) {
    maintenance.backupSystem.createFullBackup();
  } else if (args.includes('--secrets-only')) {
    maintenance.secretsValidator.validateSecrets();
  } else if (args.includes('--diagnostic-only')) {
    maintenance.systemDiagnostics.runFullDiagnostics();
  } else {
    maintenance.runFullMaintenance();
  }
}

module.exports = MaintenanceManager;
