import fetch from "node-fetch";
import express from "express";

const app = express();

// rota básica para o Railway saber que o serviço está vivo
app.get("/api/health", (req, res) => res.send("ok"));

// pega a URL da variável de ambiente do Railway
const url = process.env.PING_URL;

async function ping() {
  try {
    const res = await fetch(url);
    console.log(`[PING] ${url} -> Status ${res.status}`);
  } catch (err) {
    console.error("[ERRO]", err.message);
  }
}

// roda o ping imediatamente e depois a cada 5 minutos
ping();
setInterval(ping, 5 * 60 * 1000);

// Railway precisa que um serviço escute a porta definida
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
