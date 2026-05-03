import { db, graphNodesTable, graphEdgesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const PROTOCOLS = [
  { name: "Uniswap", slug: "uniswap", category: "dex", chains: ["Ethereum", "Polygon", "Arbitrum", "Base", "Optimism"], tags: ["defi", "amm", "liquidity", "dex", "swap"] },
  { name: "Aave", slug: "aave", category: "lending", chains: ["Ethereum", "Polygon", "Arbitrum", "Avalanche"], tags: ["defi", "lending", "borrowing", "yield", "liquidity"] },
  { name: "Chainlink", slug: "chainlink", category: "oracle", chains: ["Ethereum", "Polygon", "BNB Chain", "Arbitrum", "Solana"], tags: ["oracle", "price-feed", "data", "vrf", "infrastructure"] },
  { name: "OpenZeppelin", slug: "openzeppelin", category: "infrastructure", chains: ["Ethereum", "Polygon", "Arbitrum"], tags: ["security", "contracts", "infrastructure", "auditing", "standards"] },
  { name: "The Graph", slug: "the-graph", category: "indexer", chains: ["Ethereum", "Polygon", "Arbitrum", "Avalanche", "BNB Chain"], tags: ["indexer", "data", "subgraph", "infrastructure", "querying"] },
  { name: "LayerZero", slug: "layerzero", category: "bridge", chains: ["Ethereum", "Polygon", "Arbitrum", "BNB Chain", "Solana", "Base"], tags: ["bridge", "cross-chain", "interoperability", "omnichain", "messaging"] },
  { name: "Compound", slug: "compound", category: "lending", chains: ["Ethereum", "Arbitrum", "Base"], tags: ["defi", "lending", "borrowing", "yield", "governance"] },
  { name: "Curve Finance", slug: "curve", category: "dex", chains: ["Ethereum", "Polygon", "Arbitrum", "Avalanche"], tags: ["defi", "amm", "stablecoin", "liquidity", "yield"] },
  { name: "1inch", slug: "1inch", category: "aggregator", chains: ["Ethereum", "Polygon", "BNB Chain", "Arbitrum"], tags: ["defi", "aggregator", "swap", "routing", "dex"] },
  { name: "Gnosis Safe", slug: "gnosis-safe", category: "wallet", chains: ["Ethereum", "Polygon", "Arbitrum", "BNB Chain"], tags: ["multisig", "wallet", "dao", "treasury", "security"] },
  { name: "Snapshot", slug: "snapshot", category: "governance", chains: ["Ethereum", "Polygon"], tags: ["dao", "governance", "voting", "community"] },
  { name: "IPFS/Filecoin", slug: "ipfs-filecoin", category: "storage", chains: ["Ethereum", "Polygon"], tags: ["storage", "decentralized", "nft", "data", "infrastructure"] },
  { name: "Alchemy", slug: "alchemy", category: "rpc", chains: ["Ethereum", "Polygon", "Arbitrum", "Optimism", "Base", "Solana"], tags: ["rpc", "infrastructure", "node", "api", "developer"] },
  { name: "Pyth Network", slug: "pyth", category: "oracle", chains: ["Solana", "Ethereum", "Arbitrum", "BNB Chain", "Sui", "Aptos"], tags: ["oracle", "price-feed", "data", "real-time", "infrastructure"] },
  { name: "Wormhole", slug: "wormhole", category: "bridge", chains: ["Ethereum", "Solana", "BNB Chain", "Polygon", "Arbitrum", "Sui", "Aptos"], tags: ["bridge", "cross-chain", "interoperability", "messaging"] },
  { name: "Polygon zkEVM", slug: "polygon-zkevm", category: "l2", chains: ["Ethereum", "Polygon"], tags: ["l2", "zk", "scaling", "infrastructure", "defi"] },
  { name: "OpenSea", slug: "opensea", category: "marketplace", chains: ["Ethereum", "Polygon", "Solana"], tags: ["nft", "marketplace", "trading", "art"] },
  { name: "Magic Eden", slug: "magic-eden", category: "marketplace", chains: ["Solana", "Ethereum", "Polygon", "Bitcoin"], tags: ["nft", "marketplace", "trading", "gaming"] },
  { name: "Axie Infinity", slug: "axie", category: "gaming", chains: ["Ethereum", "Ronin"], tags: ["gaming", "nft", "play-to-earn", "p2e", "metaverse"] },
  { name: "Immutable X", slug: "immutable-x", category: "gaming-l2", chains: ["Ethereum"], tags: ["gaming", "nft", "l2", "zk", "marketplace"] },
];

const CHAINS = [
  { name: "Ethereum", slug: "ethereum-chain", category: "l1", chains: ["Ethereum"], tags: ["evm", "l1", "defi", "nft", "dao", "infrastructure", "smart-contracts"] },
  { name: "Polygon", slug: "polygon-chain", category: "l2", chains: ["Polygon"], tags: ["evm", "l2", "scaling", "defi", "nft", "gaming", "low-fees"] },
  { name: "Solana", slug: "solana-chain", category: "l1", chains: ["Solana"], tags: ["l1", "high-speed", "low-fees", "defi", "nft", "gaming"] },
  { name: "Arbitrum", slug: "arbitrum-chain", category: "l2", chains: ["Arbitrum"], tags: ["evm", "l2", "optimistic-rollup", "defi", "low-fees"] },
  { name: "Base", slug: "base-chain", category: "l2", chains: ["Base"], tags: ["evm", "l2", "coinbase", "defi", "social", "low-fees"] },
  { name: "BNB Chain", slug: "bnb-chain", category: "l1", chains: ["BNB Chain"], tags: ["evm", "l1", "defi", "gaming", "low-fees", "high-volume"] },
  { name: "Avalanche", slug: "avalanche-chain", category: "l1", chains: ["Avalanche"], tags: ["evm", "l1", "subnets", "defi", "gaming", "enterprise"] },
  { name: "Sui", slug: "sui-chain", category: "l1", chains: ["Sui"], tags: ["l1", "move", "high-speed", "defi", "gaming", "new"] },
  { name: "Aptos", slug: "aptos-chain", category: "l1", chains: ["Aptos"], tags: ["l1", "move", "high-speed", "defi", "gaming", "new"] },
];

const DAOS = [
  { name: "Uniswap DAO", slug: "uniswap-dao", category: "dao", chains: ["Ethereum"], tags: ["dao", "governance", "defi", "voting", "grants"] },
  { name: "Aave DAO", slug: "aave-dao", category: "dao", chains: ["Ethereum"], tags: ["dao", "governance", "defi", "lending", "grants"] },
  { name: "MakerDAO", slug: "makerdao", category: "dao", chains: ["Ethereum"], tags: ["dao", "governance", "defi", "stablecoin", "dai"] },
  { name: "Compound DAO", slug: "compound-dao", category: "dao", chains: ["Ethereum"], tags: ["dao", "governance", "defi", "lending"] },
  { name: "Gitcoin DAO", slug: "gitcoin-dao", category: "dao", chains: ["Ethereum"], tags: ["dao", "grants", "public-goods", "funding", "community"] },
  { name: "Arbitrum DAO", slug: "arbitrum-dao", category: "dao", chains: ["Arbitrum", "Ethereum"], tags: ["dao", "governance", "l2", "grants"] },
];

const INVESTORS = [
  { name: "a16z Crypto", slug: "a16z-crypto", category: "vc", chains: [], tags: ["vc", "seed", "series-a", "defi", "infrastructure", "gaming", "dao"] },
  { name: "Paradigm", slug: "paradigm", category: "vc", chains: [], tags: ["vc", "seed", "series-a", "defi", "infrastructure", "research"] },
  { name: "Multicoin Capital", slug: "multicoin", category: "vc", chains: ["Solana"], tags: ["vc", "solana", "defi", "gaming", "infrastructure"] },
  { name: "Polychain Capital", slug: "polychain", category: "vc", chains: [], tags: ["vc", "defi", "infrastructure", "layer1", "protocol"] },
  { name: "Binance Labs", slug: "binance-labs", category: "vc", chains: ["BNB Chain"], tags: ["vc", "bnb", "defi", "gaming", "infrastructure", "launchpad"] },
  { name: "Coinbase Ventures", slug: "coinbase-ventures", category: "vc", chains: ["Base", "Ethereum"], tags: ["vc", "defi", "infrastructure", "consumer", "base"] },
];

async function seedGraph() {
  console.log("Seeding graph nodes...");

  const allNodes = [
    ...PROTOCOLS.map((p) => ({ ...p, type: "protocol" as const })),
    ...CHAINS.map((c) => ({ ...c, type: "chain" as const })),
    ...DAOS.map((d) => ({ ...d, type: "dao" as const })),
    ...INVESTORS.map((i) => ({ ...i, type: "investor" as const })),
  ];

  let inserted = 0;
  let skipped = 0;

  for (const node of allNodes) {
    const existing = await db
      .select()
      .from(graphNodesTable)
      .where(eq(graphNodesTable.slug, node.slug));

    if (existing.length === 0) {
      await db.insert(graphNodesTable).values({
        type: node.type,
        name: node.name,
        slug: node.slug,
        category: node.category,
        chains: node.chains,
        tags: node.tags,
        description: `${node.type}: ${node.name}`,
      });
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  process.exit(0);
}

seedGraph().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
