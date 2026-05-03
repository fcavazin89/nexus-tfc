import { db, graphNodesTable, graphEdgesTable } from "@workspace/db";
import { eq, and, inArray, ne } from "drizzle-orm";

export interface MatchScore {
  nodeId: number;
  name: string;
  type: string;
  category: string | null;
  chains: string[] | null;
  description: string | null;
  matchScore: number;
  breakdown: {
    categoryMatch: number;
    chainAlignment: number;
    tagRelevance: number;
  };
  relationshipType: string;
}

function cosineSimilarityKeywords(
  aKeywords: string[],
  bKeywords: string[],
): number {
  if (!aKeywords.length || !bKeywords.length) return 0;
  const aSet = new Set(aKeywords.map((k) => k.toLowerCase()));
  const bSet = new Set(bKeywords.map((k) => k.toLowerCase()));
  let intersection = 0;
  for (const k of aSet) {
    if (bSet.has(k)) intersection++;
  }
  return intersection / Math.sqrt(aSet.size * bSet.size);
}

const TYPE_CATEGORY_MAP: Record<string, string[]> = {
  DeFi: ["defi", "dex", "lending", "yield", "liquidity", "amm", "stablecoin"],
  NFT: ["nft", "marketplace", "gaming", "metaverse", "art"],
  Gaming: ["gaming", "nft", "metaverse", "play-to-earn", "p2e"],
  DAO: ["dao", "governance", "voting", "treasury"],
  Infrastructure: ["infrastructure", "rpc", "indexer", "data", "storage"],
  Bridge: ["bridge", "cross-chain", "interoperability", "layerzero"],
  Oracle: ["oracle", "data", "price-feed", "chainlink"],
  Social: ["social", "identity", "community", "dao"],
  Other: [],
};

const RELATIONSHIP_MAP: Record<string, string> = {
  protocol: "USES",
  chain: "BUILDS_ON",
  dao: "PARTNERS_WITH",
  investor: "SEEKS",
  startup: "CONNECTED_TO",
};

export async function computeGraphMatches(
  projectType: string,
  primaryChain: string,
  goals: string[],
  description: string,
): Promise<MatchScore[]> {
  const nodes = await db
    .select()
    .from(graphNodesTable)
    .where(ne(graphNodesTable.type, "startup"));

  const projectKeywords = [
    ...(TYPE_CATEGORY_MAP[projectType] ?? []),
    primaryChain.toLowerCase(),
    ...goals.map((g) => g.toLowerCase().replace(/ /g, "-")),
    ...description.toLowerCase().split(/\s+/).filter((w) => w.length > 4),
  ];

  const scores: MatchScore[] = nodes.map((node) => {
    const nodeKeywords = [
      ...(node.tags ?? []),
      ...(node.chains ?? []).map((c) => c.toLowerCase()),
      node.category ?? "",
      node.type,
    ].filter(Boolean);

    const tagRelevance = cosineSimilarityKeywords(projectKeywords, nodeKeywords);

    const chainAlignment =
      (node.chains ?? []).some(
        (c) => c.toLowerCase() === primaryChain.toLowerCase(),
      )
        ? 0.5
        : (node.chains ?? []).length === 0
          ? 0.2
          : 0.1;

    const projectCats = TYPE_CATEGORY_MAP[projectType] ?? [];
    const categoryMatch =
      projectCats.includes(node.category ?? "") ||
      projectCats.some((c) => (node.tags ?? []).includes(c))
        ? 0.4
        : 0.1;

    const matchScore =
      tagRelevance * 0.4 + chainAlignment * 0.3 + categoryMatch * 0.3;

    return {
      nodeId: node.id,
      name: node.name,
      type: node.type,
      category: node.category,
      chains: node.chains,
      description: node.description,
      matchScore: Math.min(Math.round(matchScore * 100) / 100, 1.0),
      breakdown: {
        categoryMatch: Math.round(categoryMatch * 100),
        chainAlignment: Math.round(chainAlignment * 100),
        tagRelevance: Math.round(tagRelevance * 100),
      },
      relationshipType: RELATIONSHIP_MAP[node.type] ?? "CONNECTED_TO",
    };
  });

  return scores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);
}

export async function addStartupNode(
  name: string,
  projectType: string,
  primaryChain: string,
  goals: string[],
  topMatches: MatchScore[],
): Promise<number> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await db
    .select()
    .from(graphNodesTable)
    .where(eq(graphNodesTable.slug, slug));

  let nodeId: number;

  if (existing.length > 0) {
    nodeId = existing[0].id;
  } else {
    const [node] = await db
      .insert(graphNodesTable)
      .values({
        type: "startup",
        name,
        slug,
        category: projectType.toLowerCase(),
        chains: [primaryChain],
        tags: goals.map((g) => g.toLowerCase().replace(/ /g, "-")),
        description: `${projectType} startup on ${primaryChain}`,
      })
      .returning();
    nodeId = node.id;
  }

  if (topMatches.length > 0) {
    const topSix = topMatches.slice(0, 6);
    await db.delete(graphEdgesTable).where(eq(graphEdgesTable.fromNodeId, nodeId));
    await db.insert(graphEdgesTable).values(
      topSix.map((m) => ({
        fromNodeId: nodeId,
        toNodeId: m.nodeId,
        relationshipType: m.relationshipType,
        weight: m.matchScore,
      })),
    );
  }

  return nodeId;
}

export async function getFullGraph() {
  const [nodes, edges] = await Promise.all([
    db.select().from(graphNodesTable),
    db.select().from(graphEdgesTable),
  ]);
  return { nodes, edges };
}
