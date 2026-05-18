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
