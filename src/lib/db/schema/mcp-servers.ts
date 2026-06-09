import { pgTable, text, timestamp, boolean, json, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  transportType: text("transportType").notNull(),
  command: text("command"),
  url: text("url"),
  args: json("args"),
  env: json("env"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
