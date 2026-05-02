import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chainsTable = pgTable("chains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  chainId: integer("chain_id"),
  rpcUrl: text("rpc_url"),
  status: text("status").notNull().default("active"),
  tvl: text("tvl"),
  agentCount: integer("agent_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChainSchema = createInsertSchema(chainsTable).omit({ id: true, createdAt: true });
export type InsertChain = z.infer<typeof insertChainSchema>;
export type Chain = typeof chainsTable.$inferSelect;
