import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const metricsTable = sqliteTable("metrics", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  agentId:    text("agent_id").notNull(),
  agentName:  text("agent_name").notNull(),
  metricType: text("metric_type").notNull(), // "performance" | "health" | "usage" | "event"
  metricName: text("metric_name").notNull(), // ex: "cpu_usage", "tx_count"
  value:      real("value").notNull(),
  unit:       text("unit"),                  // "%" | "ms" | "count" | "bytes"
  tags:       text("tags").default("{}"),    // JSON: { chain: "eth", env: "dev" }
  timestamp:  integer("timestamp").notNull(), // unix ms
  createdAt:  integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const agentConnectionsTable = sqliteTable("agent_connections", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  agentId:     text("agent_id").notNull().unique(),
  agentName:   text("agent_name").notNull(),
  agentType:   text("agent_type").notNull(), // "nexus" | "chain" | "custom"
  status:      text("status").notNull().default("connected"), // "connected" | "disconnected"
  lastSeen:    integer("last_seen").notNull(),
  connectedAt: integer("connected_at").notNull(),
  metadata:    text("metadata").default("{}"), // JSON com info extra
});

export type Metric = typeof metricsTable.$inferSelect;
export type InsertMetric = typeof metricsTable.$inferInsert;
export type AgentConnection = typeof agentConnectionsTable.$inferSelect;
export type InsertAgentConnection = typeof agentConnectionsTable.$inferInsert;
