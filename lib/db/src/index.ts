import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Localiza o arquivo WASM em múltiplos caminhos candidatos
function findWasm(): Buffer {
  const candidates = [
    resolve(__dirname, "sql-wasm.wasm"),
    resolve(__dirname, "../../node_modules/sql.js/dist/sql-wasm.wasm"),
    resolve(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
    resolve(process.cwd(), "dist/sql-wasm.wasm"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p);
  }
  throw new Error(
    `sql-wasm.wasm não encontrado. Caminhos tentados:\n${candidates.join("\n")}\n` +
    `Execute: pnpm install`
  );
}

// Garante que o diretório data/ existe
const dataDir = resolve(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

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

// Persiste o banco em disco
export function persistDb(): void {
  writeFileSync(dbPath, sqliteDb.export());
}

export const db = drizzle(sqliteDb, { schema });

export * from "./schema";
