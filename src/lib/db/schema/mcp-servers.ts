import { pgTable, uuid, text, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  transportType: text("transport_type").default("stdio"),
  command: text("command"),
  url: text("url"),
  args: json("args"),
  env: json("env"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
