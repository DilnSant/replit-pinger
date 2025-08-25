
# Configuração de Ping Externo - Método Brandness

## URLs do App (ATUALIZADAS)

**Para Monitoramento (USE ESTA):**
`https://b11959b9-296f-4b48-a6a9-962290608715-00-2aki85zt5f42b.kirk.replit.dev`

**Para Usuários (Encurtada):**
`https://tinyurl.com/GestorMetodoBrandness`

⚠️ **IMPORTANTE:** Use sempre a URL original/direta para serviços de monitoramento. URLs encurtadas podem causar problemas de redirecionamento.

## Configuração Atual do UptimeRobot (NECESSITA ATUALIZAÇÃO)

### Status Atual:
- ✅ **Sistema interno de ping**: Funcionando (pings a cada 90 segundos)
- ⚠️ **UptimeRobot externo**: NECESSITA ATUALIZAÇÃO com URL correta
- ✅ **Supabase**: Conectado e funcionando

### Configuração Recomendada no UptimeRobot:

1. **Acesse**: https://uptimerobot.com
2. **Edite o monitor existente** ou crie um novo
3. **Configurações otimizadas**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Método Brandness - Keep Alive
   - **URL**: `https://b11959b9-296f-4b48-a6a9-962290608715-00-2aki85zt5f42b.kirk.replit.dev`
   - **Monitoring Interval**: 5 minutes
   - **Monitor Timeout**: 30 seconds
   - **HTTP Method**: GET
   - **Follow Redirects**: Yes
   - **User Agent**: UptimeRobot-KeepAlive

### Endpoint de Saúde Supabase

Para verificar a conectividade com Supabase, o app responde no endpoint raiz (`/`) e `/health` com status 200 quando tudo está funcionando.

### Redundância Completa:
1. **Ping interno**: A cada 90 segundos (aplicação - FUNCIONANDO)
2. **UptimeRobot externo**: A cada 5 minutos (independente - NECESSITA ATUALIZAÇÃO)
3. **Supabase**: Sempre conectado como único banco de dados - FUNCIONANDO

## Verificação de Status

### Como verificar se está funcionando:
```bash
# Teste manual da URL
curl -I https://b11959b9-296f-4b48-a6a9-962290608715-00-2aki85zt5f42b.kirk.replit.dev

# Deve retornar HTTP/2 200
```

### Logs para monitorar:
- **Ping interno**: `[Auto-ping #X] ✅ Status: 200`
- **Supabase**: `✅ [Supabase] Connection successful`

## 🚨 AÇÃO IMEDIATA:

1. **Atualize o UptimeRobot AGORA** com a nova URL
2. **Verifique** se o monitor está ativo
3. **Teste** fazendo uma pausa manual no monitor e reativando

## Configurações de Alerta (UptimeRobot):
- **Alert When Down**: Yes
- **Email Alerts**: Ativo
- **SMS Alerts**: Opcional
- **Down Alert Delay**: 0 minutes (imediato)

## Status Esperado:
- ✅ **Uptime**: 99%+ 
- ✅ **Response Time**: < 2s
- ✅ **Supabase**: Conectado
