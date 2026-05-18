# Implementation Plan: Automated Startup Script — Nexus Global Web3

## Overview

Migração do banco de dados de PostgreSQL para sql.js (SQLite puro JS), criação do sistema de Metrics Agent com WebSocket, reconfiguração de portas, script PowerShell de inicialização automática e dashboard de métricas no frontend. Todas as tarefas são incrementais e constroem umas sobre as outras, terminando com a integração completa.

## Tasks

- [x] 1. Migrar lib/db de PostgreSQL para sql.js
  - [x] 1.1 Atualizar `lib/db/package.json`
    - Remover dependências `pg` e `@types/pg`
    - Adicionar `sql.js` como dependência de produção
    - Adicionar `@types/sql.js` como devDependency se disponível
    - _Requirements: 3.7, 3.8_

  - [x] 1.2 Atualizar `lib/db/drizzle.config.ts` para dialect SQLite
    - Substituir `dialect: "postgresql"` por `dialect: "sqlite"`
    - Atualizar `dbCredentials` para usar caminho de arquivo SQLite (`data/database.sqlite`)
    - Remover dependência de `DATABASE_URL` como connection string PostgreSQL
    - _Requirements: 3.3_

  - [x] 1.3 Converter schema `lib/db/src/schema/agents.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial` para `integer` com `{ mode: "number" }` e `.primaryKey({ autoIncrement: true })`
    - Converter `timestamp` para `integer` com `.notNull()` (unix ms)
    - _Requirements: 11.1, 11.2_

  - [x] 1.4 Converter schema `lib/db/src/schema/activity.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial` e `timestamp` conforme mapeamento SQLite
    - _Requirements: 11.1, 11.2_

  - [x] 1.5 Converter schema `lib/db/src/schema/chains.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial` e `timestamp` conforme mapeamento SQLite
    - _Requirements: 11.1, 11.2_

  - [x] 1.6 Converter schema `lib/db/src/schema/conversations.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Remover opção `{ withTimezone: true }` do campo `createdAt` (não suportada em SQLite)
    - _Requirements: 11.1, 11.2_

  - [x] 1.7 Converter schema `lib/db/src/schema/ecosystem.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial` e `timestamp` conforme mapeamento SQLite
    - _Requirements: 11.1, 11.2_

  - [x] 1.8 Converter schema `lib/db/src/schema/graph.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial`, `timestamp`, `jsonb` (→ `text`) e arrays (→ `text` com JSON serializado)
    - Converter `chains: text("chains").array()` e `tags: text("tags").array()` para `text` simples
    - _Requirements: 11.1, 11.2_

  - [x] 1.9 Converter schema `lib/db/src/schema/messages.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Manter a referência de chave estrangeira `conversationId → conversations.id` com `onDelete: "cascade"`
    - Remover opção `{ withTimezone: true }` do campo `createdAt`
    - _Requirements: 11.1, 11.2, 11.5_

  - [x] 1.10 Converter schema `lib/db/src/schema/partnerships.ts` de pgTable para sqliteTable
    - Substituir imports de `drizzle-orm/pg-core` por `drizzle-orm/sqlite-core`
    - Converter `serial` e `timestamp` conforme mapeamento SQLite
    - _Requirements: 11.1, 11.2_

  - [x] 1.11 Criar `lib/db/src/schema/metrics.ts` (novo schema)
    - Criar tabela `metricsTable` com campos: `id`, `agentId`, `agentName`, `metricType`, `metricName`, `value`, `unit`, `tags`, `timestamp`, `createdAt`
    - Criar tabela `agentConnectionsTable` com campos: `id`, `agentId`, `agentName`, `agentType`, `status`, `lastSeen`, `connectedAt`, `metadata`
    - Exportar tipos TypeScript inferidos de ambas as tabelas
    - _Requirements: 11.1_

  - [x] 1.12 Atualizar `lib/db/src/schema/index.ts` para exportar metrics
    - Adicionar `export * from "./metrics"` ao arquivo de barrel
    - _Requirements: 11.1_

  - [x] 1.13 Reescrever `lib/db/src/index.ts` usando sql.js + drizzle-orm/sql-js
    - Importar `initSqlJs` de `sql.js` e `drizzle` de `drizzle-orm/sql-js`
    - Implementar função `findWasm()` que busca `sql-wasm.wasm` em múltiplos caminhos candidatos (dist/, node_modules/)
    - Garantir criação do diretório `data/` se não existir
    - Carregar banco existente de `data/database.sqlite` ou criar novo
    - Exportar `db`, `persistDb` e re-exportar `* from "./schema"`
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 4.3, 4.4_

- [x] 2. Checkpoint — Verificar compilação do lib/db
  - Garantir que `pnpm --filter @workspace/db typecheck` passa sem erros de tipo.
  - Confirmar que todos os schemas exportam os tipos corretos.
  - Perguntar ao usuário se há dúvidas antes de continuar.

- [x] 3. Atualizar build process do backend
  - [x] 3.1 Atualizar `artifacts/api-server/build.mjs` para copiar sql-wasm.wasm
    - Adicionar imports de `copyFile` e `access` de `node:fs/promises`
    - Implementar função `copyWasm()` que copia `node_modules/sql.js/dist/sql-wasm.wasm` para `dist/`
    - Chamar `copyWasm()` após o bloco `esbuild(...)` dentro de `buildAll()`
    - Lançar erro descritivo se o arquivo WASM não for encontrado
    - Logar mensagem de sucesso após cópia
    - _Requirements: 4.1, 4.2, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 3.2 Remover `sql.js` da lista de `external` do esbuild em `build.mjs`
    - Garantir que `sql.js` não está na lista `external` (precisa ser bundled, não externalizado)
    - Verificar que `better-sqlite3` e `sqlite3` permanecem na lista external (são nativos)
    - _Requirements: 4.1_

- [x] 4. Criar Metrics Agent System no backend
  - [x] 4.1 Criar `artifacts/api-server/src/metrics/metricsTypes.ts`
    - Definir interfaces TypeScript: `RegisterMessage`, `MetricMessage`, `PingMessage`, `IncomingMessage` (union type)
    - Definir interfaces de resposta: `RegisteredResponse`, `PongResponse`, `MetricUpdateResponse`, `ErrorResponse`
    - Definir interface `MetricPayload` para ingestão HTTP
    - Definir interface `HttpMetricsRequest` para o body do POST /api/metrics
    - _Requirements: (suporte a 3.2, 3.3 do design)_

  - [x] 4.2 Criar `artifacts/api-server/src/metrics/MetricsAgent.ts`
    - Importar `WebSocketServer` e `WebSocket` de `ws`
    - Importar `db`, `metricsTable`, `agentConnectionsTable` de `@workspace/db`
    - Implementar classe `MetricsAgent` com construtor recebendo `http.Server`
    - Criar `WebSocketServer` com `{ server, path: "/metrics" }`
    - Implementar `handleConnection(ws)`: registrar listeners de `message`, `close`, `error`
    - Implementar `handleMessage(ws, agentId, msg)`: processar tipos `register`, `metric`, `ping`
    - Implementar `saveMetric(data)`: persistir em `metricsTable` e chamar `persistDb()`
    - Implementar `broadcastToFrontend(metric)`: enviar `metric_update` para clientes frontend
    - Implementar `startHeartbeatCheck()`: verificar conexões inativas a cada 60s
    - Exportar instância ou classe para uso em `index.ts`
    - _Requirements: P2, P3 (design)_

  - [x] 4.3 Criar `artifacts/api-server/src/metrics/metricsRouter.ts`
    - Criar router Express com as rotas: `GET /metrics`, `POST /metrics`, `GET /metrics/agents`, `GET /metrics/agents/:agentId`, `GET /metrics/summary`, `DELETE /metrics/agents/:agentId`
    - Implementar `GET /metrics`: listar métricas com filtros opcionais (agentId, metricType, limit)
    - Implementar `POST /metrics`: ingestão HTTP de métricas (alternativa ao WebSocket)
    - Implementar `GET /metrics/agents`: listar agentes conectados/registrados
    - Implementar `GET /metrics/agents/:agentId`: métricas de um agente específico
    - Implementar `GET /metrics/summary`: resumo agregado (avg, min, max por metricName)
    - Implementar `DELETE /metrics/agents/:agentId`: marcar agente como desconectado
    - _Requirements: 3.3 do design_

  - [x] 4.4 Adicionar dependência `ws` ao `artifacts/api-server/package.json`
    - Adicionar `"ws": "^8"` em `dependencies`
    - Adicionar `"@types/ws": "^8"` em `devDependencies`
    - _Requirements: (suporte ao MetricsAgent)_

  - [x] 4.5 Atualizar `artifacts/api-server/src/index.ts` para criar `http.Server` e passar ao MetricsAgent
    - Importar `http` de `node:http`
    - Importar `MetricsAgent` de `./metrics/MetricsAgent`
    - Criar `const server = http.createServer(app)` em vez de `app.listen()`
    - Instanciar `new MetricsAgent(server)` após criar o servidor HTTP
    - Chamar `server.listen(port, callback)` em vez de `app.listen()`
    - _Requirements: 1.4, 7.1_

  - [x] 4.6 Atualizar `artifacts/api-server/src/routes/index.ts` para incluir metricsRouter
    - Importar `metricsRouter` de `../metrics/metricsRouter`
    - Adicionar `router.use(metricsRouter)` ao router principal
    - _Requirements: (suporte às rotas de métricas)_

  - [x] 4.7 Atualizar `artifacts/api-server/src/app.ts` para documentar integração com MetricsAgent
    - Não é necessário alterar a lógica do app Express (MetricsAgent usa o http.Server diretamente)
    - Verificar que o app exporta corretamente para ser usado com `http.createServer(app)`
    - _Requirements: 1.4_

- [x] 5. Checkpoint — Verificar compilação e build do backend
  - Garantir que `pnpm --filter @workspace/api-server typecheck` passa sem erros.
  - Garantir que `pnpm --filter @workspace/api-server build` completa com sucesso e `dist/sql-wasm.wasm` existe.
  - Perguntar ao usuário se há dúvidas antes de continuar.

- [x] 6. Configurar novas portas nos arquivos de configuração
  - [x] 6.1 Atualizar `artifacts/api-server/.replit-artifact/artifact.toml`
    - Substituir todas as ocorrências de porta `8080` por `3001`
    - Atualizar variável de ambiente `PORT` para `"3001"`
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 6.2 Atualizar `artifacts/nexus/.replit-artifact/artifact.toml`
    - Substituir todas as ocorrências de porta `18245` por `4000`
    - Atualizar variável de ambiente `PORT` para `"4000"`
    - _Requirements: 5.2, 5.4, 5.6_

- [x] 7. Criar script PowerShell START-NOW.ps1 na raiz do projeto
  - Criar arquivo `Nexus-Global-Web3/START-NOW.ps1` com as seguintes seções:
  - **Funções de output colorido**: `Write-Status` (amarelo), `Write-Success` (verde), `Write-Fail` (vermelho)
  - **Verificação de pré-requisitos**:
    - Verificar `node --version` (falhar com instrução de instalação se ausente)
    - Verificar `pnpm --version` (falhar com instrução de instalação se ausente)
    - Verificar existência de `node_modules` na raiz (falhar com instrução `pnpm install` se ausente)
    - Verificar `node_modules\lightningcss-win32-x64-msvc` (tentar instalar automaticamente se ausente)
  - **Criação de diretório**: criar `data\` se não existir com `New-Item -ItemType Directory`
  - **Variáveis de ambiente do backend**: `NODE_ENV`, `PORT=3001`, `DATABASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - **Variáveis de ambiente do frontend**: `NODE_ENV`, `PORT=4000`, `BASE_PATH=/`
  - **Iniciar backend**: `Start-Process powershell` com título "Nexus Backend - Port 3001", executando `pnpm --filter @workspace/api-server run dev`
  - **Aguardar 5 segundos**: `Start-Sleep -Seconds 5`
  - **Iniciar frontend**: `Start-Process powershell` com título "Nexus Frontend - Port 4000", executando `pnpm --filter @workspace/nexus run dev`
  - **Resumo final**: exibir URLs `http://localhost:3001` e `http://localhost:4000` em verde
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.4, 9.1, 9.5, 10.1, 10.2, 10.3, 10.4, 10.6, 10.7_

- [x] 8. Criar MetricsDashboard no frontend
  - [x] 8.1 Criar `artifacts/nexus/src/pages/MetricsDashboard.tsx`
    - Criar componente React funcional `MetricsDashboard`
    - Conectar via WebSocket a `ws://localhost:3001/metrics` usando `useEffect` e `useRef`
    - Gerenciar estado: lista de agentes conectados, métricas recentes (últimas 50 por agente)
    - Processar mensagens `metric_update` e atualizar estado React
    - Exibir lista de agentes com status (conectado/desconectado), nome, tipo e `lastSeen`
    - Exibir tabela ou cards de métricas em tempo real por agente
    - Implementar reconexão automática com backoff exponencial em caso de desconexão
    - Limpar conexão WebSocket no cleanup do `useEffect`
    - _Requirements: 5.7_

  - [ ]* 8.2 Escrever testes unitários para MetricsDashboard
    - Testar renderização inicial sem conexão WebSocket
    - Testar atualização de estado ao receber mensagem `metric_update`
    - Testar lógica de reconexão automática
    - _Requirements: 5.7_

- [x] 9. Criar README.md na raiz do projeto
  - Criar `Nexus-Global-Web3/README.md` com as seguintes seções:
  - **Quick Start**: comando `.\START-NOW.ps1` e pré-requisitos (Node.js 18+, pnpm)
  - **Portas**: tabela com Backend (3001), Frontend (4000), Mockup Sandbox (8081 — não alterar)
  - **Variáveis de Ambiente**: tabela documentando todas as variáveis, valores padrão e serviço
  - **Migração PostgreSQL → sql.js**: explicação da razão (evitar compilação nativa no Windows) e impacto
  - **Troubleshooting**: seção com problemas comuns:
    - `lightningcss-win32-x64-msvc` ausente → `pnpm add -D lightningcss-win32-x64-msvc`
    - `sql-wasm.wasm` não encontrado → `pnpm install` e rebuild
    - Porta em uso → verificar processos com `netstat -ano | findstr :3001`
    - `node_modules` ausente → `pnpm install`
  - **Instalação de Pré-requisitos**: links e comandos para Node.js e pnpm
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 10. Checkpoint final — Integração completa
  - Garantir que todos os arquivos modificados compilam sem erros de tipo.
  - Verificar que `START-NOW.ps1` existe na raiz e `README.md` está completo.
  - Verificar que `dist/sql-wasm.wasm` é gerado após o build do backend.
  - Perguntar ao usuário se há dúvidas antes de encerrar.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- A ordem das tarefas é importante: lib/db deve ser migrado antes do backend ser compilado
- O script START-NOW.ps1 deve ser executado manualmente pelo usuário no PowerShell (`.\START-NOW.ps1`)
- O arquivo `data/database.sqlite` é criado em runtime pelo lib/db — não commitar no git
- O `sql-wasm.wasm` precisa estar em `dist/` para o backend funcionar em produção (build.mjs cuida disso)
- O Mockup Sandbox na porta 8081 não deve ser alterado
- Chave de API configurada aponta para Groq (compatível com OpenAI API)
