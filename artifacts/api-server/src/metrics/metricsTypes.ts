// Mensagens recebidas dos agentes via WebSocket
export interface RegisterMessage {
  type: "register";
  agentId: string;
  agentName: string;
  agentType: string; // "nexus" | "chain" | "custom"
  metadata?: Record<string, unknown>;
}

export interface MetricMessage {
  type: "metric";
  agentId: string;
  metricType: string; // "performance" | "health" | "usage" | "event"
  metricName: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number; // unix ms
}

export interface PingMessage {
  type: "ping";
  agentId: string;
}

export type IncomingMessage = RegisterMessage | MetricMessage | PingMessage;

// Mensagens enviadas pelo servidor
export interface RegisteredResponse {
  type: "registered";
  agentId: string;
}

export interface PongResponse {
  type: "pong";
}

export interface MetricUpdateResponse {
  type: "metric_update";
  data: MetricPayload;
}

export interface ErrorResponse {
  type: "error";
  message: string;
}

export type OutgoingMessage =
  | RegisteredResponse
  | PongResponse
  | MetricUpdateResponse
  | ErrorResponse;

// Payload de métrica normalizado
export interface MetricPayload {
  agentId: string;
  agentName: string;
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number;
}

// Body do POST /api/metrics (ingestão HTTP)
export interface HttpMetricsRequest {
  agentId: string;
  agentName: string;
  metrics: Array<{
    metricType: string;
    metricName: string;
    value: number;
    unit?: string;
    tags?: Record<string, string>;
    timestamp: number;
  }>;
}
