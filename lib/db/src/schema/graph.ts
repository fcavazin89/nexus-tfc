import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const graphNodesTable = sqliteTable("graph_nodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category"),
  chains: text("chains").default("[]"),   // JSON array serializado
  tags: text("tags").default("[]"),       // JSON array serializado
  description: text("description"),
  metadata: text("metadata").default("{}"), // JSON serializado (era jsonb)
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const graphEdgesTable = sqliteTable("graph_edges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromNodeId: integer("from_node_id").notNull(),
  toNodeId: integer("to_node_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  weight: real("weight").default(1.0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export type GraphNode = typeof graphNodesTable.$inferSelect;
export type InsertGraphNode = typeof graphNodesTable.$inferInsert;
export type GraphEdge = typeof graphEdgesTable.$inferSelect;
export type InsertGraphEdge = typeof graphEdgesTable.$inferInsert;
