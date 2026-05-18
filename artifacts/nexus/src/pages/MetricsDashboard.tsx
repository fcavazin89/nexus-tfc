import { useEffect, useRef, useState, useCallback } from "react";

interface AgentConnection {
  agentId: string;
  agentName: string;
  agentType: string;
  status: "connected" | "disconnected";
  lastSeen: number;
  connectedAt: number;
}

interface MetricEntry {
  id?: number;
  agentId: string;
  agentName: string;
  metricType: string;
  metricName: string;
  value: number;
  unit?: string | null;
  tags?: Record<string, string>;
  timestamp: number;
}

const WS_URL = "ws://localhost:3001/metrics?frontend=true";
const MAX_METRICS_PER_AGENT = 50;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

export default function MetricsDashboard() {
  const [agents, setAgents] = useState<AgentConnection[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricEntry[]>>({});
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setLastError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === "metric_update") {
          const metric: MetricEntry = msg.data;
          setMetrics((prev) => {
            const agentMetrics = prev[metric.agentId] ?? [];
            const updated = [metric, ...agentMetrics].slice(0, MAX_METRICS_PER_AGENT);
            return { ...prev, [metric.agentId]: updated };
          });
        }
      } catch {
        // ignora mensagens malformadas
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Reconexão com backoff exponencial
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, reconnectAttemptsRef.current),
        RECONNECT_MAX_MS
      );
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setLastError("Erro na conexão WebSocket com o servidor de métricas");
    };
  }, []);

  // Busca lista de agentes via HTTP
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/metrics/agents");
      if (res.ok) {
        const data = await res.json() as AgentConnection[];
        setAgents(data);
      }
    } catch {
      // silencioso — backend pode não estar pronto ainda
    }
  }, []);

  useEffect(() => {
    connect();
    fetchAgents();

    // Atualiza lista de agentes a cada 10s
    const interval = setInterval(fetchAgents, 10_000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect, fetchAgents]);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const connectedAgents = agents.filter((a) => a.status === "connected");
  const disconnectedAgents = agents.filter((a) => a.status === "disconnected");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Metrics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Monitoramento de agentes em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`}
          />
          <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {lastError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-sm">
          {lastError}
        </div>
      )}

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Agentes Ativos</p>
          <p className="text-3xl font-bold text-green-400">{connectedAgents.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Agentes Inativos</p>
          <p className="text-3xl font-bold text-gray-500">{disconnectedAgents.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Métricas Recebidas</p>
          <p className="text-3xl font-bold text-blue-400">
            {Object.values(metrics).reduce((acc, m) => acc + m.length, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de agentes */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Agentes Conectados
          </h2>
          {agents.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Nenhum agente registrado ainda.
              <br />
              <span className="text-xs">Conecte via ws://localhost:3001/metrics</span>
            </p>
          ) : (
            <ul className="space-y-2">
              {agents.map((agent) => (
                <li
                  key={agent.agentId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div
                    className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      agent.status === "connected" ? "bg-green-400" : "bg-gray-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.agentName}</p>
                    <p className="text-xs text-gray-500">{agent.agentType}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Último ping: {formatTime(agent.lastSeen)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Feed de métricas em tempo real */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Métricas em Tempo Real
          </h2>
          {Object.keys(metrics).length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              Aguardando métricas dos agentes...
            </p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {Object.entries(metrics).map(([agentId, agentMetrics]) => (
                <div key={agentId}>
                  <p className="text-xs text-gray-500 mb-2 font-mono">{agentId}</p>
                  <div className="space-y-1">
                    {agentMetrics.slice(0, 10).map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                              m.metricType === "performance"
                                ? "bg-blue-900/50 text-blue-300"
                                : m.metricType === "health"
                                ? "bg-green-900/50 text-green-300"
                                : m.metricType === "usage"
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-purple-900/50 text-purple-300"
                            }`}
                          >
                            {m.metricType}
                          </span>
                          <span className="text-gray-300">{m.metricName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-white">
                            {m.value.toFixed(2)}
                            {m.unit ? <span className="text-gray-500 ml-1">{m.unit}</span> : null}
                          </span>
                          <span className="text-gray-600 text-xs">{formatTime(m.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
