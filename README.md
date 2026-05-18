# Nexus Global Web3

## Quick Start

```powershell
.\START-NOW.ps1
```

Isso irá:
1. Verificar Node.js, pnpm e dependências
2. Instalar `lightningcss-win32-x64-msvc` se necessário
3. Criar o diretório `data/` para o banco SQLite
4. Iniciar o **Backend** em `http://localhost:3001`
5. Iniciar o **Frontend** em `http://localhost:4000`

---

## Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend API | **3001** | http://localhost:3001 |
| Backend WebSocket (Métricas) | **3001** | ws://localhost:3001/metrics |
| Frontend App | **4000** | http://localhost:4000 |
| Mockup Sandbox | 8081 | http://localhost:8081 (não alterar) |

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [pnpm](https://pnpm.io) — instale com `npm install -g pnpm`

---

## Variáveis de Ambiente

| Variável | Valor Padrão | Serviço | Descrição |
|----------|-------------|---------|-----------|
| `NODE_ENV` | `development` | Backend + Frontend | Ambiente de execução |
| `PORT` | `3001` | Backend | Porta do servidor Express |
| `PORT` | `4000` | Frontend | Porta do servidor Vite |
| `BASE_PATH` | `/` | Frontend | Caminho base da aplicação |
| `DATABASE_URL` | `file:./data/database.sqlite` | Backend | Caminho do banco SQLite |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | — | Backend | Chave da API Groq/OpenAI |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` | Backend | URL base da API de IA |

---

## Banco de Dados

O projeto usa **sql.js** (SQLite compilado para JavaScript puro), sem necessidade de compilação nativa.

- Arquivo do banco: `data/database.sqlite` (criado automaticamente)
- ORM: Drizzle ORM com dialect `sqlite`

### Migração de PostgreSQL para sql.js

| Aspecto | Antes (PostgreSQL) | Depois (sql.js) |
|---------|-------------------|-----------------|
| Banco | PostgreSQL (servidor separado) | SQLite (arquivo único) |
| Compilação nativa | Sim (`pg`, `better-sqlite3`) | Não |
| Build Tools | Visual Studio necessário | Nenhuma |
| Setup | Difícil no Windows | Fácil |

---

## Metrics Agent

O backend expõe um servidor de métricas ao qual agentes externos podem se conectar:

### WebSocket
```
ws://localhost:3001/metrics
```

**Registrar agente:**
```json
{ "type": "register", "agentId": "meu-agente", "agentName": "Meu Agente", "agentType": "custom" }
```

**Enviar métrica:**
```json
{ "type": "metric", "agentId": "meu-agente", "metricType": "performance", "metricName": "latency_ms", "value": 42.5, "unit": "ms", "timestamp": 1715432100000 }
```

### HTTP (alternativa)
```
POST http://localhost:3001/api/metrics
```

### Endpoints REST
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/metrics` | Lista métricas |
| POST | `/api/metrics` | Ingestão HTTP |
| GET | `/api/metrics/agents` | Lista agentes |
| GET | `/api/metrics/agents/:id` | Métricas de um agente |
| GET | `/api/metrics/summary` | Resumo agregado |

---

## Troubleshooting

### `lightningcss-win32-x64-msvc` ausente
```powershell
pnpm add -D lightningcss-win32-x64-msvc
```

### `sql-wasm.wasm` não encontrado
```powershell
pnpm install
pnpm --filter @workspace/api-server run build
```

### Porta em uso
```powershell
# Verificar processo na porta 3001
netstat -ano | findstr :3001

# Verificar processo na porta 4000
netstat -ano | findstr :4000
```

### `node_modules` ausente
```powershell
pnpm install
```

### Erro de permissão no PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
