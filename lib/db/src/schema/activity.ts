import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  entityId: integer("entity_id"),
  entityType: text("entity_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Activity = typeof activityTable.$inferSelect;
