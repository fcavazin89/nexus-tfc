import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnershipsTable = pgTable("partnerships", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  status: text("status").notNull().default("pending"),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  chainIds: text("chain_ids").default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnershipSchema = createInsertSchema(partnershipsTable).omit({ id: true, createdAt: true });
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnershipsTable.$inferSelect;
