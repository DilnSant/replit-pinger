#!/usr/bin/env node
/**
 * Script para atualizar automaticamente o domínio do Replit
 * Uso: node scripts/update-domain.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateDomain() {
  try {
    // Obter o domínio atual do REPLIT_DOMAINS
    const currentDomain = process.env.REPLIT_DOMAINS;
    
    if (!currentDomain) {
      console.log('❌ REPLIT_DOMAINS não encontrado nas variáveis de ambiente');
      return;
    }

    console.log(`🔍 Domínio atual detectado: ${currentDomain}`);

    // Ler o arquivo vite-utils.ts
    const viteUtilsPath = path.join(path.dirname(__dirname), 'server', 'vite-utils.ts');
    
    if (!fs.existsSync(viteUtilsPath)) {
      console.log('❌ Arquivo server/vite-utils.ts não encontrado');
      return;
    }

    let content = fs.readFileSync(viteUtilsPath, 'utf8');

    // Verificar se o domínio já está na lista
    if (content.includes(currentDomain)) {
      console.log('✅ Domínio já está configurado');
      return;
    }

    // Encontrar a seção allowedHosts e adicionar o novo domínio
    const allowedHostsRegex = /(allowedHosts: \[[\s\S]*?)(      \],)/;
    const match = content.match(allowedHostsRegex);

    if (!match) {
      console.log('❌ Seção allowedHosts não encontrada');
      return;
    }

    // Adicionar o novo domínio à lista
    const newEntry = `        '${currentDomain}',\n`;
    const updatedSection = match[1] + newEntry + match[2];
    content = content.replace(allowedHostsRegex, updatedSection);

    // Escrever o arquivo atualizado
    fs.writeFileSync(viteUtilsPath, content);

    console.log('✅ Domínio adicionado com sucesso aos allowedHosts');
    console.log('🔄 Reinicie o servidor para aplicar as alterações');

    // Atualizar o replit.md
    updateReplitMd(currentDomain);

  } catch (error) {
    console.error('❌ Erro ao atualizar domínio:', error.message);
  }
}

function updateReplitMd(newDomain) {
  try {
    const replitMdPath = path.join(path.dirname(__dirname), 'replit.md');
    
    if (!fs.existsSync(replitMdPath)) {
      console.log('⚠️  Arquivo replit.md não encontrado');
      return;
    }

    let content = fs.readFileSync(replitMdPath, 'utf8');
    
    // Atualizar a seção de domínio atual
    const domainRegex = /(- \*\*Current Domain\*\*: )[^(]+(.*)/;
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const replacement = `$1${newDomain} (as of ${currentDate})$2`;
    
    content = content.replace(domainRegex, replacement);
    
    fs.writeFileSync(replitMdPath, content);
    console.log('✅ Arquivo replit.md atualizado');
    
  } catch (error) {
    console.error('⚠️  Erro ao atualizar replit.md:', error.message);
  }
}

// Executar o script
updateDomain();

export { updateDomain };