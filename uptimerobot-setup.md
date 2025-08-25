
# 🤖 Configuração do UptimeRobot

## 1. Criar Conta no UptimeRobot
- Acesse: https://uptimerobot.com/
- Crie uma conta gratuita (permite até 50 monitores)

## 2. Adicionar Monitor HTTP(S)
- **Monitor Type**: HTTP(S)
- **Friendly Name**: `Brandness App - Production`
- **URL**: `https://0dbad373-cf4d-43ae-9562-9eb33cce2e17-00-1i0t2smu03vri.kirk.replit.dev`
- **Monitoring Interval**: 5 minutos (plano gratuito)

## 3. Configurações Recomendadas
- **HTTP Method**: GET
- **HTTP Username/Password**: (deixar vazio)
- **Keyword**: (opcional - pode usar "serving on port")
- **Alert Contacts**: adicionar seu email

## 4. Notificações
- Email quando down/up
- SMS (plano pago)
- Webhook para Slack/Discord

## 5. Status Page (Opcional)
- Criar página pública de status
- URL: `https://stats.uptimerobot.com/XXXXXXX`

## 6. Verificação
Após configurar, o UptimeRobot fará requests a cada 5 minutos para manter o app ativo.

## 7. Teste Manual
```bash
curl -I https://0dbad373-cf4d-43ae-9562-9eb33cce2e17-00-1i0t2smu03vri.kirk.replit.dev
```

Deve retornar: `HTTP/2 200 OK`

## 📊 Status Esperado
- **Uptime**: 99.9%
- **Response Time**: < 500ms
- **Alerts**: Apenas se realmente offline
- **Coverage**: 24/7 sem interrupção
