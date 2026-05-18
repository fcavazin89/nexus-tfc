import { Router, type IRouter } from "express";
import { db, metricsTable, agentConnectionsTable, persistDb } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { HttpMetricsRequest } from "./metricsTypes";

const router: IRouter = Router();

// GET /metrics — lista métricas com filtros opcionais
router.get("/metrics", async (req, res) => {
  const { agentId, metricType, limit = "100" } = req.query as Record<string, string>;
  let query = db.select().from(metricsTable).orderBy(desc(metricsTable.timestamp));

  const rows = await query.limit(Number(limit));

  const filtered = rows.filter((r) => {
    if (agentId && r.agentId !== agentId) return false;
    if (metricType && r.metricType !== metricType) return false;
    return true;
  });

  res.json(filtered.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "{}") })));
});

// POST /metrics — ingestão HTTP de métricas (alternativa ao WebSocket)
router.post("/metrics", async (req, res) => {
  const body = req.body as HttpMetricsRequest;

  if (!body.agentId || !body.agentName || !Array.isArray(body.metrics)) {
    return res.status(400).json({ error: "agentId, agentName e metrics são obrigatórios" });
  }

  let accepted = 0;
  let rejected = 0;

  for (const m of body.metrics) {
    try {
      await db.insert(metricsTable).values({
        agentId: body.agentId,
        agentName: body.agentName,
        metricType: m.metricType,
        metricName: m.metricName,
        value: m.value,
        unit: m.unit ?? null,
        tags: JSON.stringify(m.tags ?? {}),
        timestamp: m.timestamp,
        createdAt: new Date(),
      });
      accepted++;
    } catch {
      rejected++;
    }
  }

  persistDb();
  res.status(201).json({ accepted, rejected });
});

// GET /metrics/agents — lista agentes conectados/registrados
router.get("/metrics/agents", async (_req, res) => {
  const rows = await db.select().from(agentConnectionsTable).orderBy(desc(agentConnectionsTable.lastSeen));
  res.json(rows.map((r) => ({ ...r, metadata: JSON.parse(r.metadata ?? "{}") })));
});

// GET /metrics/agents/:agentId — métricas de um agente específico
router.get("/metrics/agents/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const { limit = "50" } = req.query as Record<string, string>;

  const [agent] = await db
    .select()
    .from(agentConnectionsTable)
    .where(eq(agentConnectionsTable.agentId, agentId));

  if (!agent) {
    return res.status(404).json({ error: "Agente não encontrado" });
  }

  const metrics = await db
    .select()
    .from(metricsTable)
    .where(eq(metricsTable.agentId, agentId))
    .orderBy(desc(metricsTable.timestamp))
    .limit(Number(limit));

  res.json({
    agent: { ...agent, metadata: JSON.parse(agent.metadata ?? "{}") },
    metrics: metrics.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "{}") })),
  });
});

// GET /metrics/summary — resumo agregado por metricName
router.get("/metrics/summary", async (_req, res) => {
  const rows = await db.select().from(metricsTable);

  const summary: Record<string, { count: number; avg: number; min: number; max: number; unit?: string | null }> = {};

  for (const row of rows) {
    const key = `${row.agentId}:${row.metricName}`;
    if (!summary[key]) {
      summary[key] = { count: 0, avg: 0, min: Infinity, max: -Infinity, unit: row.unit };
    }
    const s = summary[key];
    s.count++;
    s.avg = (s.avg * (s.count - 1) + row.value) / s.count;
    s.min = Math.min(s.min, row.value);
    s.max = Math.max(s.max, row.value);
  }

  res.json(summary);
});

// DELETE /metrics/agents/:agentId — desconectar agente
router.delete("/metrics/agents/:agentId", async (req, res) => {
  const { agentId } = req.params;
  await db
    .update(agentConnectionsTable)
    .set({ status: "disconnected" })
    .where(eq(agentConnectionsTable.agentId, agentId));
  persistDb();
  res.status(204).send();
});

export default router;
