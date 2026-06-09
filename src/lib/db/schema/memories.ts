import { pgTable, uuid, text, timestamp, json } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { users } from "./users";
import { conversations } from "./conversations";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
});

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding"),
  tags: json("tags"),
  sourceConversationId: uuid("source_conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").defaultNow(),
});
