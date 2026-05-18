import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const activityTable = sqliteTable("activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  entityId: integer("entity_id"),
  entityType: text("entity_type"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export type Activity = typeof activityTable.$inferSelect;
