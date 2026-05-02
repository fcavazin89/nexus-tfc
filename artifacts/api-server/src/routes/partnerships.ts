import { Router, type IRouter } from "express";
import { db, partnershipsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePartnershipBody,
  GetPartnershipParams,
  UpdatePartnershipParams,
  UpdatePartnershipBody,
  DeletePartnershipParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parsePartnership(p: typeof partnershipsTable.$inferSelect) {
  return {
    ...p,
    chainIds: JSON.parse(p.chainIds ?? "[]"),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/partnerships", async (req, res) => {
  const rows = await db.select().from(partnershipsTable).orderBy(partnershipsTable.createdAt);
  res.json(rows.map(parsePartnership));
});

router.post("/partnerships", async (req, res) => {
  const body = CreatePartnershipBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .insert(partnershipsTable)
    .values({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .returning();
  await db.insert(activityTable).values({
    type: "partnership_signed",
    title: `Partnership with ${body.name} established`,
    description: `Type: ${body.type}`,
    entityId: row.id,
    entityType: "partnership",
  });
  res.status(201).json(parsePartnership(row));
});

router.get("/partnerships/:id", async (req, res) => {
  const { id } = GetPartnershipParams.parse(req.params);
  const [row] = await db.select().from(partnershipsTable).where(eq(partnershipsTable.id, id));
  if (!row) return res.status(404).json({ error: "Partnership not found" });
  res.json(parsePartnership(row));
});

router.put("/partnerships/:id", async (req, res) => {
  const { id } = UpdatePartnershipParams.parse(req.params);
  const body = UpdatePartnershipBody.parse(req.body);
  const { chainIds, ...rest } = body;
  const [row] = await db
    .update(partnershipsTable)
    .set({ ...rest, chainIds: JSON.stringify(chainIds ?? []) })
    .where(eq(partnershipsTable.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Partnership not found" });
  res.json(parsePartnership(row));
});

router.delete("/partnerships/:id", async (req, res) => {
  const { id } = DeletePartnershipParams.parse(req.params);
  await db.delete(partnershipsTable).where(eq(partnershipsTable.id, id));
  res.status(204).send();
});

export default router;
