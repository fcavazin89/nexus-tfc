# Design Document

## Overview

Este documento descreve a arquitetura técnica do sistema de automação de inicialização do Nexus Global Web3, incluindo a migração de PostgreSQL para sql.js, configuração de novas portas, script PowerShell de automação e o novo **Agente de Métricas** — um servidor centralizado ao qual outros agentes se conectam para reportar e consultar métricas em tempo real.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        START-NOW.ps1                            │
│  ┌─────────────────┐          ┌──────────────────────────────┐  │
│  │  Verificação de │          │  Configuração de Variáveis   │  │
│  │  Pré-requisitos │          │  de Ambiente                 │  │
│  └────────┬────────┘          └──────────────┬───────────────┘  │
│           └──────────────┬───────────────────┘                  │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Inicialização de Serviços                    │  │
│  │  ┌─────────────────────┐   ┌─────────────────────────┐   │  │
│  │  │  Backend (porta 3001)│   │ Frontend (porta 4000)   │   │  │
│  │  │  Nova janela PS     │   │ Nova janela PS           │   │  │
│  │  └─────────────────────┘   └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express - porta 3001)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  API Routes  │  │  Metrics     │  │  WebSocket Server     │  │
│  │  /api/*      │  │  Agent       │  │  (Agentes conectam)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
│         └─────────────────┴──────────────────────┘              │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Database Layer (sql.js + Drizzle)          │    │
│  │              SQLite: data/database.sqlite               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Frontend (Vite/React - porta 4000)            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  Dashboard UI    │  │  Metrics Dashboard (tempo real)      │ │
│  │  (existente)     │  │  Gráficos, status, alertas           │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Agentes Externos                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Agent A  │  │ Agent B  │  │ Agent C  │  │  Agent N...  │   │
│  │ (nexus)  │  │ (chain)  │  │ (custom) │  │              │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └─────────────┴─────────────┴────────────────┘           │
│                            │ WebSocket / HTTP POST              │
│                            ▼                                    │
│              ws://localhost:3001/metrics  (WS)                  │
│              POST /api/metrics            (HTTP)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. PowerShell Startup Script (START-NOW.ps1)

**Localização:** `Nexus-Global-Web3/START-NOW.ps1`

**Fluxo de execução:**

```
START-NOW.ps1
│
├── 1. Verificar Node.js (node --version)
├── 2. Verificar pnpm (pnpm --version)
├── 3. Verificar node_modules (Test-Path)
├── 4. Verificar lightningcss-win32-x64-msvc
├── 5. Criar diretório data/ se não existir
├── 6. Copiar sql-wasm.wasm para dist/ se necessário
├── 7. Definir variáveis de ambiente
├── 8. Iniciar Backend em nova janela PowerShell
├── 9. Aguardar 5 segundos
├── 10. Iniciar Frontend em nova janela PowerShell
└── 11. Exibir URLs de acesso
```

**Variáveis de ambiente configuradas:**

| Variável | Valor | Serviço |
|----------|-------|---------|
| `NODE_ENV` | `development` | Backend + Frontend |
| `PORT` | `3001` | Backend |
| `PORT` | `4000` | Frontend |
| `BASE_PATH` | `/` | Frontend |
| `DATABASE_URL` | `file:./data/database.sqlite` | Backend |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | `gsk_BxMsq...` | Backend |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` | Backend |

**Estrutura do script:**

```powershell
# START-NOW.ps1
param(
  [switch]$SkipChecks
)

function Write-Status($msg)  { Write-Host "[INFO]  $msg" -ForegroundColor Yellow }
function Write-Success($msg) { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Fail($msg)    { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# --- Verificações ---
# --- Variáveis de Ambiente ---
# --- Iniciar Backend ---
# --- Aguardar ---
# --- Iniciar Frontend ---
# --- Resumo ---
```

---

### 2. Database Layer Migration (PostgreSQL → sql.js)

**Arquivos afetados:**
- `lib/db/src/index.ts` — substituir pg por sql.js
- `lib/db/drizzle.config.ts` — mudar dialect para sqlite
- `lib/db/package.json` — remover pg, adicionar sql.js
- `artifacts/api-server/build.mjs` — copiar sql-wasm.wasm

**Novo `lib/db/src/index.ts`:**

```typescript
import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Localiza o WASM — em dev usa node_modules, em prod usa dist/
function findWasm(): Buffer {
  const candidates = [
    resolve(__dirname, "sql-wasm.wasm"),
    resolve(__dirname, "../node_modules/sql.js/dist/sql-wasm.wasm"),
    resolve(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p);
  }
  throw new Error(
    `sql-wasm.wasm não encontrado. Caminhos tentados:\n${candidates.join("\n")}`
  );
}

// Garante que o diretório data/ existe
const dataDir = resolve(process.cwd(), "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = resolve(dataDir, "database.sqlite");

const wasmBinary = findWasm();
const SQL = await initSqlJs({ wasmBinary });

// Carrega banco existente ou cria novo
let sqliteDb: InstanceType<typeof SQL.Database>;
if (existsSync(dbPath)) {
  sqliteDb = new SQL.Database(readFileSync(dbPath));
} else {
  sqliteDb = new SQL.Database();
}

// Persiste o banco em disco a cada operação de escrita
function persistDb() {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(dbPath, sqliteDb.export());
}

export const db = drizzle(sqliteDb, { schema });
export { persistDb };
export * from "./schema";
```

**Novo `lib/db/drizzle.config.ts`:**

```typescript
import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data/database.sqlite");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
```

**Schema SQLite — conversão de tipos:**

| PostgreSQL (pgTable) | SQLite (sqliteTable) |
|---------------------|---------------------|
| `serial` | `integer` (autoincrement) |
| `text` | `text` |
| `integer` | `integer` |
| `real` | `real` |
| `timestamp` | `integer` (unix ms) |
| `boolean` | `integer` (0/1) |

---

### 3. Metrics Agent System

O **Agente de Métricas** é um servidor centralizado embutido no backend que:
- Aceita conexões de múltiplos agentes via **WebSocket** e **HTTP POST**
- Armazena métricas no SQLite
- Expõe endpoints REST para consulta
- Transmite métricas em tempo real para o frontend via WebSocket

#### 3.1 Schema de Métricas (SQLite)

```typescript
// lib/db/src/schema/metrics.ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const metricsTable = sqliteTable("metrics", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  agentId:    text("agent_id").notNull(),       // ID do agente que reportou
  agentName:  text("agent_name").notNull(),     // Nome legível do agente
  metricType: text("metric_type").notNull(),    // "performance" | "health" | "usage" | "event"
  metricName: text("metric_name").notNull(),    // ex: "cpu_usage", "tx_count"
  value:      real("value").notNull(),          // valor numérico
  unit:       text("unit"),                     // "%" | "ms" | "count" | "bytes"
  tags:       text("tags").default("{}"),       // JSON: { chain: "eth", env: "dev" }
  timestamp:  integer("timestamp").notNull(),   // unix ms
  createdAt:  integer("created_at").notNull(),
});

export const agentConnectionsTable = sqliteTable("agent_connections", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  agentId:     text("agent_id").notNull().unique(),
  agentName:   text("agent_name").notNull(),
  agentType:   text("agent_type").notNull(),    // "nexus" | "chain" | "custom"
  status:      text("status").notNull().default("connected"), // "connected" | "disconnected"
  lastSeen:    integer("last_seen").notNull(),
  connectedAt: integer("connected_at").notNull(),
  metadata:    text("metadata").default("{}"),  // JSON com info extra
});
```

#### 3.2 Protocolo de Comunicação

**WebSocket (ws://localhost:3001/metrics)**

Mensagens enviadas pelos agentes:

```typescript
// Registro do agente
{
  "type": "register",
  "agentId": "agent-abc-123",
  "agentName": "Nexus Chain Monitor",
  "agentType": "chain"
}

// Envio de métrica
{
  "type": "metric",
  "agentId": "agent-abc-123",
  "metricType": "performance",
  "metricName": "tx_latency_ms",
  "value": 142.5,
  "unit": "ms",
  "tags": { "chain": "ethereum", "network": "mainnet" },
  "timestamp": 1715432100000
}

// Heartbeat (a cada 30s)
{
  "type": "ping",
  "agentId": "agent-abc-123"
}
```

Mensagens enviadas pelo servidor:

```typescript
// Confirmação de registro
{ "type": "registered", "agentId": "agent-abc-123" }

// Resposta ao ping
{ "type": "pong" }

// Broadcast de métrica para o frontend
{ "type": "metric_update", "data": { ...metric } }

// Erro
{ "type": "error", "message": "..." }
```

**HTTP POST /api/metrics** (alternativa sem WebSocket)

```typescript
// Request
POST /api/metrics
Content-Type: application/json
{
  "agentId": "agent-abc-123",
  "agentName": "My Agent",
  "metrics": [
    {
      "metricType": "health",
      "metricName": "uptime_pct",
      "value": 99.8,
      "unit": "%",
      "timestamp": 1715432100000
    }
  ]
}

// Response 201
{ "accepted": 1, "rejected": 0 }
```

#### 3.3 Rotas da API de Métricas

```
GET  /api/metrics                    → lista métricas (com filtros)
POST /api/metrics                    → ingestão HTTP de métricas
GET  /api/metrics/agents             → lista agentes conectados
GET  /api/metrics/agents/:agentId    → métricas de um agente específico
GET  /api/metrics/summary            → resumo agregado (avg, min, max)
DELETE /api/metrics/agents/:agentId  → desconectar agente
```

#### 3.4 Estrutura de Arquivos do Metrics Agent

```
artifacts/api-server/src/
├── metrics/
│   ├── MetricsAgent.ts       ← servidor WebSocket + lógica central
│   ├── metricsRouter.ts      ← rotas HTTP /api/metrics
│   └── metricsTypes.ts       ← tipos TypeScript compartilhados
```

**MetricsAgent.ts — estrutura:**

```typescript
import { WebSocketServer, WebSocket } from "ws";
import { db } from "@workspace/db";
import { metricsTable, agentConnectionsTable } from "@workspace/db";

export class MetricsAgent {
  private wss: WebSocketServer;
  private connections = new Map<string, WebSocket>();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/metrics" });
    this.wss.on("connection", this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket) { ... }
  private handleMessage(ws: WebSocket, agentId: string, msg: unknown) { ... }
  private async saveMetric(data: MetricPayload) { ... }
  private broadcastToFrontend(metric: unknown) { ... }
  private startHeartbeatCheck() { ... }
}
```

---

### 4. Port Configuration

**Arquivos a atualizar:**

| Arquivo | Campo | Valor Antigo | Valor Novo |
|---------|-------|-------------|------------|
| `artifacts/api-server/.replit-artifact/artifact.toml` | `PORT` | `8080` | `3001` |
| `artifacts/nexus/.replit-artifact/artifact.toml` | `PORT` | `18245` | `4000` |
| `START-NOW.ps1` | `$env:PORT` | — | `3001` / `4000` |

---

### 5. Build Process Updates (build.mjs)

Adicionar cópia do `sql-wasm.wasm` após o build do esbuild:

```javascript
// Após o bloco esbuild(...)
import { copyFile, access } from "node:fs/promises";
import { resolve } from "node:path";

async function copyWasm() {
  const wasmSrc = resolve(
    artifactDir,
    "../../node_modules/sql.js/dist/sql-wasm.wasm"
  );
  const wasmDest = resolve(distDir, "sql-wasm.wasm");

  try {
    await access(wasmSrc);
    await copyFile(wasmSrc, wasmDest);
    console.log("✓ sql-wasm.wasm copiado para dist/");
  } catch {
    throw new Error(
      `sql-wasm.wasm não encontrado em: ${wasmSrc}\n` +
      `Execute: pnpm add sql.js`
    );
  }
}

// Chamar no buildAll():
await buildAll();
await copyWasm();
```

---

### 6. lightningcss Verification

O `lightningcss` é usado pelo `@tailwindcss/vite` no frontend. No Windows, requer o binário nativo pré-compilado.

**Verificação no START-NOW.ps1:**

```powershell
$lightningPath = "node_modules\lightningcss-win32-x64-msvc"
if (-not (Test-Path $lightningPath)) {
    Write-Fail "lightningcss-win32-x64-msvc não encontrado"
    Write-Status "Execute: pnpm add -D lightningcss-win32-x64-msvc"
    # Tenta instalar automaticamente
    pnpm add -D lightningcss-win32-x64-msvc
}
```

**Adição ao `pnpm-workspace.yaml`:**

```yaml
# Garantir que o binário Windows seja instalado
overrides:
  lightningcss: "^1.x"
```

---

## Data Flow

### Fluxo de Inicialização

```
Usuário executa .\START-NOW.ps1
        │
        ▼
Verificar Node.js, pnpm, node_modules
        │
        ▼
Verificar lightningcss-win32-x64-msvc
        │
        ▼
Criar data/ e copiar sql-wasm.wasm
        │
        ▼
Definir variáveis de ambiente
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
Start-Process powershell                Start-Process powershell
"Nexus Backend - Port 3001"             "Nexus Frontend - Port 4000"
pnpm --filter api-server run dev        (aguarda 5s)
        │                               pnpm --filter nexus run dev
        ▼
Backend inicia Express + MetricsAgent
        │
        ▼
WebSocket server em /metrics pronto
        │
        ▼
Agentes externos conectam via WS
```

### Fluxo de Métricas

```
Agente Externo
    │
    │ ws://localhost:3000/metrics
    ▼
MetricsAgent.handleConnection()
    │
    ├── type: "register" → salva em agent_connections
    ├── type: "metric"   → salva em metrics + broadcast frontend
    └── type: "ping"     → responde "pong" + atualiza last_seen

Frontend (React)
    │
    │ ws://localhost:3001/metrics (como observador)
    ▼
Recebe "metric_update" → atualiza estado React → re-render dashboard
```

---

## File Structure Changes

```
Nexus-Global-Web3/
├── START-NOW.ps1                          ← NOVO
├── README.md                              ← NOVO
├── data/
│   └── database.sqlite                    ← CRIADO em runtime
│
├── lib/db/
│   ├── src/
│   │   ├── index.ts                       ← MODIFICADO (pg → sql.js)
│   │   └── schema/
│   │       ├── index.ts                   ← MODIFICADO (+ metrics)
│   │       ├── agents.ts                  ← MODIFICADO (pg → sqlite)
│   │       ├── activity.ts                ← MODIFICADO (pg → sqlite)
│   │       ├── chains.ts                  ← MODIFICADO (pg → sqlite)
│   │       ├── conversations.ts           ← MODIFICADO (pg → sqlite)
│   │       ├── ecosystem.ts               ← MODIFICADO (pg → sqlite)
│   │       ├── graph.ts                   ← MODIFICADO (pg → sqlite)
│   │       ├── messages.ts                ← MODIFICADO (pg → sqlite)
│   │       ├── partnerships.ts            ← MODIFICADO (pg → sqlite)
│   │       └── metrics.ts                 ← NOVO
│   ├── drizzle.config.ts                  ← MODIFICADO (sqlite dialect)
│   └── package.json                       ← MODIFICADO (pg → sql.js)
│
├── artifacts/api-server/
│   ├── src/
│   │   ├── app.ts                         ← MODIFICADO (+ MetricsAgent)
│   │   ├── index.ts                       ← MODIFICADO (+ WS server)
│   │   ├── metrics/
│   │   │   ├── MetricsAgent.ts            ← NOVO
│   │   │   ├── metricsRouter.ts           ← NOVO
│   │   │   └── metricsTypes.ts            ← NOVO
│   │   └── routes/
│   │       └── index.ts                   ← MODIFICADO (+ metricsRouter)
│   ├── build.mjs                          ← MODIFICADO (+ copyWasm)
│   └── .replit-artifact/artifact.toml     ← MODIFICADO (porta 3000)
│
└── artifacts/nexus/
    ├── src/
    │   └── pages/
    │       └── MetricsDashboard.tsx        ← NOVO
    └── .replit-artifact/artifact.toml     ← MODIFICADO (porta 5173)
```

---

## Correctness Properties

### P1 — Inicialização Determinística
O script START-NOW.ps1 deve sempre produzir o mesmo resultado dado o mesmo estado do sistema: se todos os pré-requisitos estão presentes, os serviços devem iniciar; se algum está ausente, deve falhar com mensagem clara.

### P2 — Persistência de Métricas
Toda métrica recebida via WebSocket ou HTTP POST deve ser persistida no SQLite antes de ser confirmada ao agente remetente. Nenhuma métrica pode ser perdida silenciosamente.

### P3 — Isolamento de Agentes
A falha ou desconexão de um agente não deve afetar outros agentes conectados nem o funcionamento do servidor de métricas.

### P4 — Compatibilidade de Schema
A migração de pgTable para sqliteTable deve preservar todos os campos e relações existentes. Nenhuma rota de API existente deve quebrar após a migração.

### P5 — WASM Disponível
O arquivo sql-wasm.wasm deve estar presente no diretório dist/ após o build. O build deve falhar explicitamente se o arquivo não puder ser copiado.

### P6 — Portas Corretas
O backend deve sempre escutar na porta 3001 e o frontend na porta 4000 quando iniciados pelo START-NOW.ps1. Conflito de porta deve ser detectado e reportado.
