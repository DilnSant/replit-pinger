import * as dotenv from "dotenv";
import path from 'path';

// Load environment variables from .env file first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Try to load from multiple sources
if (!process.env.DATABASE_URL) {
  // Try loading from .env again with different path
  dotenv.config();
}

// Set default values for development if missing
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'development-session-secret-change-in-production';
}

// Set default JWT secret if missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development-jwt-secret-change-in-production';
}

// Debug: Print environment variables status (without exposing values)
console.log('Environment variables status:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('REPL_ID:', process.env.REPL_ID ? 'Set' : 'Not set');
console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS ? 'Set' : 'Not set');

import express, { type Request, Response, NextFunction } from "express";
import router from "./routes";
import { setupVite, serveStatic, log } from "./vite-utils";
import { supabase } from './db';

// Test Supabase connection on startup
async function initializeApp() {
  try {
    const { checkDatabaseConnection } = await import('./db');
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      log('Supabase connection successful');
    } else {
      log('Supabase connection failed - some features may not work');
    }
  } catch (error) {
    log('Supabase connection failed:');
    console.error(error);
    log('Continuing without database - some features may not work');
  }
}

const app = express();
app.set("trust proxy", 1);

// CORS Configuration for Supabase integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directory if it doesn't exist
import { mkdir } from 'fs/promises';

try {
  await mkdir('uploads', { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Serve uploaded files estaticamente...
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

//  Aqui adicionamos o healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Create uploads directory if it doesn't exist
import { mkdir } from 'fs/promises';

try {
  await mkdir('uploads', { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Serve attached assets statically
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  app.use(router);

  const { createServer } = await import("http");
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    initializeApp();

    // ===== SISTEMA ROBUSTO DE AUTO-PING =====
    import("axios").then(({ default: axios }) => {
      const REPLIT_DOMAINS = process.env.REPLIT_DOMAINS;
      if (REPLIT_DOMAINS) {
        const domains = REPLIT_DOMAINS.split(',');
        const SELF_URL = `https://${domains[0]}`;

        let pingCount = 0;
        let lastPingTime = 0;
        let consecutiveFailures = 0;
        let pingInterval: NodeJS.Timeout | null = null;
        let supabaseCheckCount = 0;

        const sendPing = async () => {
          const now = Date.now();

          // Evitar múltiplos pings simultâneos - otimizado para 60s para melhor eficiência
          if (now - lastPingTime < 60000) { 
            return;
          }

          lastPingTime = now;
          pingCount++;

          try {
            const startTime = Date.now();

            console.log(`[Auto-ping #${pingCount}] Enviando para: ${SELF_URL}`);

            const response = await axios.get(`${SELF_URL}/api/health`, { 
              timeout: 15000, // Aumentado para 15s para maior estabilidade
              headers: { 
                'User-Agent': 'Internal-KeepAlive-Bot',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Ping-Source': 'internal',
                'Accept': 'application/json'
              },
              validateStatus: (status) => status < 500
            });

            const responseTime = Date.now() - startTime;
            consecutiveFailures = 0;

            // Verificar Supabase a cada 10 pings
            supabaseCheckCount++;
            let supabaseStatus = '';
            if (supabaseCheckCount % 10 === 0) {
              try {
                const { checkDatabaseConnection } = await import('./db');
                const isSupabaseOk = await checkDatabaseConnection();
                supabaseStatus = isSupabaseOk ? ' | Supabase: ✅' : ' | Supabase: ❌';
              } catch {
                supabaseStatus = ' | Supabase: ⚠️';
              }
            }

            const memUsage = process.memoryUsage();
            const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

            console.log(`[Auto-ping #${pingCount}] ✅ Status: ${response.status} | Tempo: ${responseTime}ms | Mem: ${memMB}MB${supabaseStatus} | ${new Date().toISOString()}`);

            // Alertas otimizados com thresholds mais inteligentes
            if (responseTime > 5000) {
              console.warn(`[Auto-ping] ⚠️ Resposta muito lenta: ${responseTime}ms`);
            } else if (responseTime > 2000) {
              console.log(`[Auto-ping] ⏳ Resposta lenta: ${responseTime}ms`);
            }

            // Verificar se response é JSON válido do health check
            if (response.data && typeof response.data === 'object' && response.data.status) {
              if (response.data.status !== 'healthy' && response.data.status !== 'ok') {
                console.warn(`[Auto-ping] ⚠️ Health status: ${response.data.status}`);
              }
            }

          } catch (error: any) {
            consecutiveFailures++;
            const errorMsg = error?.code || error?.message || 'Erro desconhecido';
            const errorType = error?.response?.status ? `HTTP ${error.response.status}` : error?.code;

            console.error(`[Auto-ping #${pingCount}] ❌ Falha ${consecutiveFailures}: ${errorType} - ${errorMsg}`);

            // Verificar Supabase em caso de erro
            if (consecutiveFailures >= 2) {
              try {
                const { checkDatabaseConnection } = await import('./db');
                const isSupabaseOk = await checkDatabaseConnection();
                console.log(`[Auto-ping] Supabase check: ${isSupabaseOk ? '✅ OK' : '❌ Problema detectado'}`);
              } catch (dbError) {
                console.error(`[Auto-ping] ❌ Erro ao verificar Supabase:`, dbError);
              }
            }

            // Retry mais agressivo para complementar UptimeRobot
            if (consecutiveFailures >= 3) {
              console.warn(`[Auto-ping] ⚠️ ${consecutiveFailures} falhas - UptimeRobot deve assumir controle`);
            }
          }
        };

        const startPingSystem = () => {
          if (pingInterval) {
            clearInterval(pingInterval);
          }

          console.log(`[Auto-ping] 🚀 Sistema iniciado (complementa UptimeRobot): ${SELF_URL}`);

          // Ping inicial após 20s (deixar UptimeRobot fazer o primeiro)
          setTimeout(sendPing, 20000);

          // Pings a cada 120 segundos (2min) para complementar UptimeRobot (5min)
          // Isso garante cobertura sem sobrecarregar o sistema
          pingInterval = setInterval(() => {
            sendPing();
          }, 120 * 1000);
        };

        setTimeout(startPingSystem, 20000);

        process.on('SIGTERM', () => {
          if (pingInterval) {
            clearInterval(pingInterval);
            console.log('[Auto-ping] Sistema encerrado graciosamente');
          }
        });

      } else {
        console.warn("[Auto-ping] ⚠️ REPLIT_DOMAINS não encontrado - depende apenas do UptimeRobot");
      }
    }).catch(err => {
      console.error("[Auto-ping] ❌ Erro ao carregar axios:", err.message);
    });
  });
})();