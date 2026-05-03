import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const graphNodesTable = pgTable("graph_nodes", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category"),
  chains: text("chains").array(),
  tags: text("tags").array(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const graphEdgesTable = pgTable("graph_edges", {
  id: serial("id").primaryKey(),
  fromNodeId: integer("from_node_id").notNull(),
  toNodeId: integer("to_node_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  weight: real("weight").default(1.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GraphNode = typeof graphNodesTable.$inferSelect;
export type InsertGraphNode = typeof graphNodesTable.$inferInsert;
export type GraphEdge = typeof graphEdgesTable.$inferSelect;
export type InsertGraphEdge = typeof graphEdgesTable.$inferInsert;
