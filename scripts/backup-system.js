
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupSystem {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupDir = `backups/${this.timestamp}`;
  }

  async createFullBackup() {
    console.log(`🔄 Iniciando backup completo em ${this.timestamp}`);
    
    try {
      // Criar diretório de backup
      fs.mkdirSync(this.backupDir, { recursive: true });
      
      // Backup do código backend
      await this.backupDirectory('server', 'backend');
      
      // Backup do código frontend
      await this.backupDirectory('client', 'frontend');
      
      // Backup das configurações compartilhadas
      await this.backupDirectory('shared', 'shared');
      
      // Backup das migrações
      await this.backupDirectory('migrations', 'migrations');
      
      // Backup dos arquivos de configuração
      await this.backupConfigFiles();
      
      // Backup das secrets (estrutura apenas, sem valores)
      await this.backupSecretsStructure();
      
      // Criar manifest do backup
      await this.createBackupManifest();
      
      console.log(`✅ Backup completo criado em: ${this.backupDir}`);
      return this.backupDir;
      
    } catch (error) {
      console.error('❌ Erro durante o backup:', error);
      throw error;
    }
  }

  async backupDirectory(sourceDir, targetName) {
    if (fs.existsSync(sourceDir)) {
      const targetDir = path.join(this.backupDir, targetName);
      fs.mkdirSync(targetDir, { recursive: true });
      
      try {
        execSync(`cp -r ${sourceDir}/* ${targetDir}/`, { stdio: 'inherit' });
        console.log(`📁 Backup de ${sourceDir} → ${targetDir}`);
      } catch (error) {
        console.log(`⚠️  Diretório ${sourceDir} vazio ou inacessível`);
      }
    }
  }

  async backupConfigFiles() {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'drizzle.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'components.json',
      '.replit',
      'replit.md'
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(this.backupDir, file));
        console.log(`📄 Backup de configuração: ${file}`);
      }
    }
  }

  async backupSecretsStructure() {
    // Nota: Apenas estrutura das secrets, não os valores por segurança
    const secretsStructure = {
      timestamp: this.timestamp,
      note: "Estrutura das secrets - valores não incluídos por segurança",
      required_secrets: [
        "DATABASE_URL",
        "SESSION_SECRET",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
      ]
    };
    
    fs.writeFileSync(
      path.join(this.backupDir, 'secrets-structure.json'),
      JSON.stringify(secretsStructure, null, 2)
    );
    console.log('🔐 Estrutura das secrets documentada');
  }

  async createBackupManifest() {
    const manifest = {
      timestamp: this.timestamp,
      date: new Date().toLocaleString('pt-BR'),
      version: "1.0.0",
      application: "brandness-app",
      backup_contents: [
        "backend (server/)",
        "frontend (client/)",
        "shared code",
        "database migrations",
        "configuration files",
        "secrets structure"
      ],
      restoration_notes: "Para restaurar, copie os diretórios de volta para a raiz do projeto"
    };
    
    fs.writeFileSync(
      path.join(this.backupDir, 'BACKUP_MANIFEST.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Criar log de backup
    const logEntry = `${new Date().toISOString()} - Backup completo criado: ${this.backupDir}\n`;
    fs.appendFileSync('backup_log.txt', logEntry);
  }
}

// Executar backup se chamado diretamente
if (require.main === module) {
  const backup = new BackupSystem();
  backup.createFullBackup()
    .then(backupPath => {
      console.log(`\n🎉 Backup concluído com sucesso!`);
      console.log(`📍 Localização: ${backupPath}`);
      console.log(`📝 Log registrado em: backup_log.txt`);
    })
    .catch(error => {
      console.error('💥 Falha no backup:', error);
      process.exit(1);
    });
}

module.exports = BackupSystem;
