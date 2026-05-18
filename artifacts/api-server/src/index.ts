import http from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { initMetricsAgent } from "./metrics/MetricsAgent";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

// Inicializa o Metrics Agent (WebSocket em /metrics)
initMetricsAgent(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
  logger.info({ url: `ws://localhost:${port}/metrics` }, "MetricsAgent WebSocket ready");
});

server.on("error", (err) => {
  logger.error({ err }, "Error starting server");
  process.exit(1);
});
