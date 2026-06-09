import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  encryptedKey: text("encryptedKey").notNull(),
  iv: text("iv").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
