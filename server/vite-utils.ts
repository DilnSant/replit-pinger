import { createServer as createViteServer } from "vite";
import express from "express";
import { Server } from "http";
import path from "path";

export function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

export async function setupVite(app: express.Application, server: Server) {
  // Create Vite dev server using existing config file
  const viteDevServer = await createViteServer({
    configFile: path.resolve(process.cwd(), "vite.config.ts"),
    server: { 
      middlewareMode: true,
      host: '0.0.0.0',
      allowedHosts: [
        '99bd4347-05d5-40a6-a311-6eb2c8ac3389-00-1ynvdztfcm1cx.worf.replit.dev',
        'bf4adee7-3c1c-47c2-8a89-b201a7d00127-00-2orjdk1bdj1i0.kirk.replit.dev',
        '01503a55-ed8f-4486-9974-5776e73b5b3d-00-2505ytce4khdn.picard.replit.dev',
        'd1340948-d8d6-4160-b728-05ff1f480921-00-3m9hcp9wzf19i.riker.replit.dev',
        '3c7cdaa0-5fc6-44e9-ae29-78ffe6c4f64e-00-3if3ltej88iu9.spock.replit.dev',
        '8f289946-e4ae-4999-940f-3a4699258855-00-1sd51h7yi42hj.worf.replit.dev',
        '.replit.dev',
        '.repl.co',
        '.replit.app',
        'localhost',
        '127.0.0.1'
      ],
      // Disable HMR completely to prevent WebSocket connection issues in Replit
      hmr: false
    }
  });

  // Block only WebSocket upgrade requests while allowing normal HTTP requests
  app.use((req, res, next) => {
    // Block WebSocket upgrade attempts
    if (req.headers.upgrade === 'websocket') {
      res.status(404).end();
      return;
    }
    
    // Block HMR ping requests but allow other Vite client requests
    if (req.path.includes('__vite_ping')) {
      res.status(204).end(); // Return success but do nothing
      return;
    }
    
    if (req.path.startsWith('/api/')) {
      next();
    } else {
      viteDevServer.middlewares(req, res, next);
    }
  });
}

export function serveStatic(app: express.Application) {
  // Serve static files in production
  app.use(express.static(path.resolve(process.cwd(), "dist/public")));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.resolve(process.cwd(), "dist/public/index.html"));
    } else {
      next();
    }
  });
}