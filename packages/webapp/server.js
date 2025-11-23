import { createRequestHandler } from "@react-router/express";
import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";

const app = express();

if (process.env.NODE_ENV === "production") {
  // 프로덕션: 빌드된 파일 사용
  app.use(express.static("build/client"));
  app.use(
    createRequestHandler({
      build: await import("./build/server/index.js"),
    }),
  );
} else {
  // 개발: Vite 개발 서버 사용
  const vite = await import("vite");
  const viteDevServer = await vite.createServer({
    server: { middlewareMode: true },
  });

  app.use(viteDevServer.middlewares);

  app.use(
    createRequestHandler({
      build: () =>
        viteDevServer.ssrLoadModule("virtual:react-router/server-build"),
    }),
  );
}

// HTTP 서버 생성
const server = createServer(app);

// WebSocket 서버를 같은 포트에 연결
const wss = new WebSocketServer({ server });

const clients = new Map();

function generateClientId() {
  return Math.random().toString(36).substring(2, 11);
}

function broadcastToClients(message, excludeId) {
  const messageStr = JSON.stringify(message);

  clients.forEach((client, id) => {
    if (id !== excludeId && client.socket.readyState === 1) {
      try {
        client.socket.send(messageStr);
      } catch (error) {
        console.error(`Failed to send message to client ${id}:`, error);
        clients.delete(id);
      }
    }
  });
}

wss.on("connection", function connection(ws) {
  const clientId = generateClientId();
  const client = {
    id: clientId,
    socket: ws,
    lastPing: Date.now(),
  };

  clients.set(clientId, client);

  console.log(
    `WebSocket Client ${clientId} connected. Total clients: ${clients.size}`,
  );

  ws.send(
    JSON.stringify({
      type: "connection",
      clientId,
      message: "Connected successfully",
    }),
  );

  ws.on("message", function message(data) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "ping":
          client.lastPing = Date.now();
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        case "broadcast":
          broadcastToClients(
            {
              type: "message",
              from: clientId,
              data: message.data,
              timestamp: new Date().toISOString(),
            },
            clientId,
          );
          break;

        default:
          console.log(`Unknown message type from ${clientId}:`, message.type);
      }
    } catch (error) {
      console.error(`Error parsing message from ${clientId}:`, error);
    }
  });

  ws.on("close", function close() {
    clients.delete(clientId);
    console.log(
      `WebSocket Client ${clientId} disconnected. Total clients: ${clients.size}`,
    );
  });

  ws.on("error", function error(err) {
    console.error(`WebSocket error for client ${clientId}:`, err);
    clients.delete(clientId);
  });
});

// 클라이언트 정리
setInterval(() => {
  const now = Date.now();
  const timeout = 30000;

  clients.forEach((client, id) => {
    if (now - client.lastPing > timeout) {
      console.log(`Client ${id} timed out`);
      client.socket.close();
      clients.delete(id);
    }
  });
}, 10000);

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available on ws://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
