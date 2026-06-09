import { pgTable, uuid, text, timestamp, json } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "cascade",
  }),
  role: text("role").notNull(),
  content: text("content").default(""),
  toolCalls: json("tool_calls"),
  toolCallId: text("tool_call_id"),
  model: text("model"),
  createdAt: timestamp("created_at").defaultNow(),
});
