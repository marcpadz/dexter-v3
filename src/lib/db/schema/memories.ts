import { pgTable, text, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { conversations } from "./conversations";
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return '[' + value.join(',') + ']';
  },
});

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding"),
  tags: json("tags"),
  sourceConversationId: uuid("sourceConversationId").references(() => conversations.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
