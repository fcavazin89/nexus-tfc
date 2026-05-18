import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ecosystemTable = sqliteTable("ecosystem_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  status: text("status").notNull().default("building"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  chainIds: text("chain_ids").default("[]"),
  tvl: text("tvl"),
  users: integer("users").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertEcosystemSchema = createInsertSchema(ecosystemTable).omit({ id: true, createdAt: true });
export type InsertEcosystem = z.infer<typeof insertEcosystemSchema>;
export type EcosystemProject = typeof ecosystemTable.$inferSelect;
