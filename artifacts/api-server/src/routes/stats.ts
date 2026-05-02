import { Router, type IRouter } from "express";
import { db, agentsTable, chainsTable, partnershipsTable, ecosystemTable, activityTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/summary", async (req, res) => {
  const [agentStats] = await db
    .select({
      total: count(),
      active: sql<number>`cast(count(*) filter (where status = 'active') as int)`,
      totalTx: sql<number>`cast(coalesce(sum(transactions_processed), 0) as int)`,
    })
    .from(agentsTable);

  const [chainStats] = await db.select({ total: count() }).from(chainsTable);

  const [partnershipStats] = await db
    .select({
      total: count(),
      active: sql<number>`cast(count(*) filter (where status = 'active') as int)`,
    })
    .from(partnershipsTable);

  const [ecoStats] = await db
    .select({
      total: count(),
      live: sql<number>`cast(count(*) filter (where status = 'live') as int)`,
    })
    .from(ecosystemTable);

  const totalAgents = agentStats?.total ?? 0;
  const activeAgents = agentStats?.active ?? 0;
  const networkHealth = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 100;

  res.json({
    totalAgents,
    activeAgents,
    totalChains: chainStats?.total ?? 0,
    totalPartnerships: partnershipStats?.total ?? 0,
    activePartnerships: partnershipStats?.active ?? 0,
    totalEcosystemProjects: ecoStats?.total ?? 0,
    liveProjects: ecoStats?.live ?? 0,
    totalTransactions: agentStats?.totalTx ?? 0,
    totalTvl: "$0",
    networkHealth,
  });
});

router.get("/stats/activity", async (req, res) => {
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.createdAt} desc`)
    .limit(20);
  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.createdAt.toISOString(),
    }))
  );
});

router.get("/stats/chain-breakdown", async (req, res) => {
  const chains = await db.select().from(chainsTable);
  const agents = await db.select().from(agentsTable);
  const projects = await db.select().from(ecosystemTable);
  const partnerships = await db.select().from(partnershipsTable);

  const breakdown = chains.map((chain) => {
    const agentCount = agents.filter((a) => {
      const ids: number[] = JSON.parse(a.chainIds ?? "[]");
      return ids.includes(chain.id);
    }).length;
    const projectCount = projects.filter((p) => {
      const ids: number[] = JSON.parse(p.chainIds ?? "[]");
      return ids.includes(chain.id);
    }).length;
    const partnershipCount = partnerships.filter((p) => {
      const ids: number[] = JSON.parse(p.chainIds ?? "[]");
      return ids.includes(chain.id);
    }).length;

    return {
      chainName: chain.name,
      chainSymbol: chain.symbol,
      agentCount,
      projectCount,
      partnershipCount,
      tvl: chain.tvl ?? "$0",
    };
  });

  res.json(breakdown);
});

export default router;
