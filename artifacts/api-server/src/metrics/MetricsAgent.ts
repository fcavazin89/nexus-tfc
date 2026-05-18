import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage as HttpIncomingMessage, Server } from "node:http";
import { db, metricsTable, agentConnectionsTable, persistDb } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import type {
  IncomingMessage,
  MetricPayload,
  OutgoingMessage,
} from "./metricsTypes";

// Clientes frontend que observam métricas em tempo real
const frontendClients = new Set<WebSocket>();

// Mapa agentId → WebSocket
const agentConnections = new Map<string, WebSocket>();

let wss: WebSocketServer | null = null;

function send(ws: WebSocket, msg: OutgoingMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastToFrontend(data: MetricPayload): void {
  const msg = JSON.stringify({ type: "metric_update", data });
  for (const client of frontendClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

async function saveMetric(payload: MetricPayload): Promise<void> {
  await db.insert(metricsTable).values({
    agentId: payload.agentId,
    agentName: payload.agentName,
    metricType: payload.metricType,
    metricName: payload.metricName,
    value: payload.value,
    unit: payload.unit ?? null,
    tags: JSON.stringify(payload.tags ?? {}),
    timestamp: payload.timestamp,
    createdAt: new Date(),
  });
  persistDb();
}

async function handleMessage(
  ws: WebSocket,
  rawData: string,
  isAgent: boolean,
  agentIdRef: { value: string | null }
): Promise<void> {
  let msg: IncomingMessage;
  try {
    msg = JSON.parse(rawData) as IncomingMessage;
  } catch {
    send(ws, { type: "error", message: "Mensagem inválida: JSON malformado" });
    return;
  }

  if (msg.type === "register") {
    agentIdRef.value = msg.agentId;
    agentConnections.set(msg.agentId, ws);

    // Upsert na tabela de conexões
    const existing = await db
      .select()
      .from(agentConnectionsTable)
      .where(eq(agentConnectionsTable.agentId, msg.agentId));

    if (existing.length > 0) {
      await db
        .update(agentConnectionsTable)
        .set({ status: "connected", lastSeen: Date.now(), agentName: msg.agentName })
        .where(eq(agentConnectionsTable.agentId, msg.agentId));
    } else {
      await db.insert(agentConnectionsTable).values({
        agentId: msg.agentId,
        agentName: msg.agentName,
        agentType: msg.agentType,
        status: "connected",
        lastSeen: Date.now(),
        connectedAt: Date.now(),
        metadata: JSON.stringify(msg.metadata ?? {}),
      });
    }
    persistDb();

    send(ws, { type: "registered", agentId: msg.agentId });
    logger.info({ agentId: msg.agentId, agentName: msg.agentName }, "Agente registrado");
    return;
  }

  if (msg.type === "metric") {
    const payload: MetricPayload = {
      agentId: msg.agentId,
      agentName: agentIdRef.value ?? msg.agentId,
      metricType: msg.metricType,
      metricName: msg.metricName,
      value: msg.value,
      unit: msg.unit,
      tags: msg.tags,
      timestamp: msg.timestamp,
    };
    await saveMetric(payload);
    broadcastToFrontend(payload);

    // Atualiza lastSeen
    await db
      .update(agentConnectionsTable)
      .set({ lastSeen: Date.now() })
      .where(eq(agentConnectionsTable.agentId, msg.agentId));
    persistDb();
    return;
  }

  if (msg.type === "ping") {
    send(ws, { type: "pong" });
    if (msg.agentId) {
      await db
        .update(agentConnectionsTable)
        .set({ lastSeen: Date.now() })
        .where(eq(agentConnectionsTable.agentId, msg.agentId));
      persistDb();
    }
    return;
  }
}

function handleConnection(ws: WebSocket, req: HttpIncomingMessage): void {
  const url = req.url ?? "";
  const isFrontend = url.includes("frontend=true");
  const agentIdRef: { value: string | null } = { value: null };

  if (isFrontend) {
    frontendClients.add(ws);
    logger.info("Frontend conectado ao Metrics Agent");
  }

  ws.on("message", (data) => {
    handleMessage(ws, data.toString(), !isFrontend, agentIdRef).catch((err) => {
      logger.error({ err }, "Erro ao processar mensagem de métrica");
      send(ws, { type: "error", message: "Erro interno ao processar mensagem" });
    });
  });

  ws.on("close", () => {
    if (isFrontend) {
      frontendClients.delete(ws);
    } else if (agentIdRef.value) {
      agentConnections.delete(agentIdRef.value);
      db.update(agentConnectionsTable)
        .set({ status: "disconnected" })
        .where(eq(agentConnectionsTable.agentId, agentIdRef.value))
        .then(() => persistDb())
        .catch((err) => logger.error({ err }, "Erro ao atualizar status de desconexão"));
      logger.info({ agentId: agentIdRef.value }, "Agente desconectado");
    }
  });

  ws.on("error", (err) => {
    logger.error({ err }, "Erro na conexão WebSocket");
  });
}

// Verifica conexões inativas a cada 60s
function startHeartbeatCheck(): void {
  setInterval(async () => {
    const threshold = Date.now() - 90_000; // 90s sem ping = inativo
    try {
      const connections = await db.select().from(agentConnectionsTable);
      for (const conn of connections) {
        if (conn.status === "connected" && conn.lastSeen < threshold) {
          await db
            .update(agentConnectionsTable)
            .set({ status: "disconnected" })
            .where(eq(agentConnectionsTable.agentId, conn.agentId));
          logger.info({ agentId: conn.agentId }, "Agente marcado como inativo por timeout");
        }
      }
      persistDb();
    } catch (err) {
      logger.error({ err }, "Erro no heartbeat check");
    }
  }, 60_000);
}

export function initMetricsAgent(server: Server): void {
  wss = new WebSocketServer({ server, path: "/metrics" });
  wss.on("connection", handleConnection);
  startHeartbeatCheck();
  logger.info("MetricsAgent iniciado em ws://localhost/metrics");
}

export { frontendClients, agentConnections };
