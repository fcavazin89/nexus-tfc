import { Router, type IRouter } from "express";
import { db, ecosystemTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateEcosystemProjectBody,
  GetEcosystemProjectParams,
  UpdateEcosystemProjectParams,
  UpdateEcosystemProjectBody,
  DeleteEcosystemProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseProject(p: typeof ecosystemTable.$inferSelect) {
  return {
    ...p,
    chainIds: JSON.parse(p.chainIds ?? "[]"),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/ecosystem", async (req, res) => {
  const rows = await db.select().from(ecosystemTable).orderBy(ecosystemTable.createdAt);
  res.json(rows.map(parseProject));
});

router.post("/ecosystem", async (req, res) => {
  const body = CreateEcosystemProjectBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .insert(ecosystemTable)
    .values({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .returning();
  await db.insert(activityTable).values({
    type: "project_launched",
    title: `${body.name} added to ecosystem`,
    description: `Category: ${body.category}`,
    entityId: row.id,
    entityType: "ecosystem",
  });
  res.status(201).json(parseProject(row));
});

router.get("/ecosystem/:id", async (req, res) => {
  const { id } = GetEcosystemProjectParams.parse(req.params);
  const [row] = await db.select().from(ecosystemTable).where(eq(ecosystemTable.id, id));
  if (!row) return res.status(404).json({ error: "Project not found" });
  res.json(parseProject(row));
});

router.put("/ecosystem/:id", async (req, res) => {
  const { id } = UpdateEcosystemProjectParams.parse(req.params);
  const body = UpdateEcosystemProjectBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .update(ecosystemTable)
    .set({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .where(eq(ecosystemTable.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Project not found" });
  res.json(parseProject(row));
});

router.delete("/ecosystem/:id", async (req, res) => {
  const { id } = DeleteEcosystemProjectParams.parse(req.params);
  await db.delete(ecosystemTable).where(eq(ecosystemTable.id, id));
  res.status(204).send();
});

export default router;
