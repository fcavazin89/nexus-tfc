import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("nexus"),
  status: text("status").notNull().default("idle"),
  description: text("description"),
  chainIds: text("chain_ids").default("[]"),
  transactionsProcessed: integer("transactions_processed").default(0),
  uptime: real("uptime").default(0),
  lastActive: integer("last_active", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
