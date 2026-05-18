import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnershipsTable = sqliteTable("partnerships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  status: text("status").notNull().default("pending"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  chainIds: text("chain_ids").default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertPartnershipSchema = createInsertSchema(partnershipsTable).omit({ id: true, createdAt: true });
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnershipsTable.$inferSelect;
