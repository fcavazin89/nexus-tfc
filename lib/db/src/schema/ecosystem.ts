import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ecosystemTable = pgTable("ecosystem_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  status: text("status").notNull().default("building"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  chainIds: text("chain_ids").default("[]"),
  tvl: text("tvl"),
  users: integer("users").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEcosystemSchema = createInsertSchema(ecosystemTable).omit({ id: true, createdAt: true });
export type InsertEcosystem = z.infer<typeof insertEcosystemSchema>;
export type EcosystemProject = typeof ecosystemTable.$inferSelect;
