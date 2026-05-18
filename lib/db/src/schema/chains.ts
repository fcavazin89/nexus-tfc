import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chainsTable = sqliteTable("chains", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  chainId: integer("chain_id"),
  rpcUrl: text("rpc_url"),
  status: text("status").notNull().default("active"),
  tvl: text("tvl"),
  agentCount: integer("agent_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertChainSchema = createInsertSchema(chainsTable).omit({ id: true, createdAt: true });
export type InsertChain = z.infer<typeof insertChainSchema>;
export type Chain = typeof chainsTable.$inferSelect;
