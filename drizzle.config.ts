import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/schema.ts",
  out: "src/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://mac:@localhost:5432/gator?sslmode=disable",
  },
});