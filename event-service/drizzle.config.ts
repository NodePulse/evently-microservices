import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.LOCAL_DB_PATH ||
      "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/event-db-local.sqlite",
  },
});
