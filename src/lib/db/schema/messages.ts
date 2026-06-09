import { pgTable, text, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCalls: json("toolCalls"),
  toolCallId: text("toolCallId"),
  model: text("model"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
