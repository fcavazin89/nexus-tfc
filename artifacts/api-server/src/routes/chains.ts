import { Router, type IRouter } from "express";
import { db, chainsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateChainBody,
  GetChainParams,
  UpdateChainParams,
  UpdateChainBody,
  DeleteChainParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chains", async (req, res) => {
  const chains = await db.select().from(chainsTable).orderBy(chainsTable.createdAt);
  res.json(chains.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/chains", async (req, res) => {
  const body = CreateChainBody.parse(req.body);
  const [chain] = await db.insert(chainsTable).values(body).returning();
  res.status(201).json({ ...chain, createdAt: chain.createdAt.toISOString() });
});

router.get("/chains/:id", async (req, res) => {
  const { id } = GetChainParams.parse(req.params);
  const [chain] = await db.select().from(chainsTable).where(eq(chainsTable.id, id));
  if (!chain) return res.status(404).json({ error: "Chain not found" });
  res.json({ ...chain, createdAt: chain.createdAt.toISOString() });
});

router.put("/chains/:id", async (req, res) => {
  const { id } = UpdateChainParams.parse(req.params);
  const body = UpdateChainBody.parse(req.body);
  const [chain] = await db.update(chainsTable).set(body).where(eq(chainsTable.id, id)).returning();
  if (!chain) return res.status(404).json({ error: "Chain not found" });
  res.json({ ...chain, createdAt: chain.createdAt.toISOString() });
});

router.delete("/chains/:id", async (req, res) => {
  const { id } = DeleteChainParams.parse(req.params);
  await db.delete(chainsTable).where(eq(chainsTable.id, id));
  res.status(204).send();
});

export default router;
