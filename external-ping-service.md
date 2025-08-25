# Sistema de Ping Externo para Método Brandness

## Objetivo
Manter o app ativo através de pings externos, independente do status do processo interno.

## Opções de Implementação

### 1. UptimeRobot (Gratuito)
- Monitora até 50 sites gratuitamente
- Ping a cada 5 minutos
- URL: https://uptimerobot.com

### 2. Cron-job.org (Gratuito)
- Executa jobs programados
- Ping personalizado a cada 2-5 minutos
- URL: https://cron-job.org

### 3. GitHub Actions (Gratuito)
- Workflow automatizado
- Ping via curl a cada poucos minutos
- Totalmente customizável

### 4. Google Cloud Functions + Scheduler (Gratuito até certo limite)
- Função serverless para ping
- Scheduler para executar regularmente

## Recomendação
Para máxima simplicidade e confiabilidade, usar **UptimeRobot** ou **Cron-job.org**.

## URL do App
`https://41c8c32c-5810-44c2-855b-13e97cd39b1b-00-ih13zahpbcly.kirk.replit.dev`