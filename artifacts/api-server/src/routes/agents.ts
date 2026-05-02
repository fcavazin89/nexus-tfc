import { Router, type IRouter } from "express";
import { db, agentsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAgentBody,
  GetAgentParams,
  UpdateAgentParams,
  UpdateAgentBody,
  DeleteAgentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseAgent(a: typeof agentsTable.$inferSelect) {
  return {
    ...a,
    chainIds: JSON.parse(a.chainIds ?? "[]"),
    createdAt: a.createdAt.toISOString(),
    lastActive: a.lastActive?.toISOString() ?? null,
  };
}

router.get("/agents", async (req, res) => {
  const rows = await db.select().from(agentsTable).orderBy(agentsTable.createdAt);
  res.json(rows.map(parseAgent));
});

router.post("/agents", async (req, res) => {
  const body = CreateAgentBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .insert(agentsTable)
    .values({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .returning();
  await db.insert(activityTable).values({
    type: "agent_deployed",
    title: `Agent "${body.name}" deployed`,
    description: `Type: ${body.type}`,
    entityId: row.id,
    entityType: "agent",
  });
  res.status(201).json(parseAgent(row));
});

router.get("/agents/:id", async (req, res) => {
  const { id } = GetAgentParams.parse(req.params);
  const [row] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
  if (!row) return res.status(404).json({ error: "Agent not found" });
  res.json(parseAgent(row));
});

router.put("/agents/:id", async (req, res) => {
  const { id } = UpdateAgentParams.parse(req.params);
  const body = UpdateAgentBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .update(agentsTable)
    .set({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .where(eq(agentsTable.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Agent not found" });
  res.json(parseAgent(row));
});

router.delete("/agents/:id", async (req, res) => {
  const { id } = DeleteAgentParams.parse(req.params);
  await db.delete(agentsTable).where(eq(agentsTable.id, id));
  res.status(204).send();
});

export default router;
