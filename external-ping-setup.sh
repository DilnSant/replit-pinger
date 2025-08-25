
#!/bin/bash

# Script de Ping Externo para Método Brandness
# Execute este script a cada 3-5 minutos em qualquer servidor externo

APP_URL="https://fde542f1-a92f-4228-b836-bc3619b53374-00-1x2yasbfn2jp6.worf.replit.dev"
LOG_FILE="/tmp/brandness-ping.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Iniciando ping para Método Brandness" >> "$LOG_FILE"

# Fazer requisição com timeout de 30 segundos
RESPONSE=$(curl -s -w "%{http_code}|%{time_total}" -o /dev/null --max-time 30 \
  -H "User-Agent: External-KeepAlive-Bot" \
  -H "Cache-Control: no-cache" \
  "$APP_URL")

if [ $? -eq 0 ]; then
    HTTP_CODE=$(echo $RESPONSE | cut -d'|' -f1)
    TIME=$(echo $RESPONSE | cut -d'|' -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Ping OK: Status $HTTP_CODE, Tempo: ${TIME}s" >> "$LOG_FILE"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠️ Status não-padrão: $HTTP_CODE" >> "$LOG_FILE"
    fi
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Ping falhou - tentando novamente..." >> "$LOG_FILE"
    sleep 30
    
    # Retry
    RETRY_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null --max-time 30 "$APP_URL")
    if [ $? -eq 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Retry: Status $RETRY_RESPONSE" >> "$LOG_FILE"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Retry também falhou" >> "$LOG_FILE"
    fi
fi

# Manter apenas as últimas 100 linhas do log
tail -n 100 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Ping concluído para: $APP_URL" >> "$LOG_FILE"
