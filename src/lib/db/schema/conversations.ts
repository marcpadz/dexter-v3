import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: text("model"),
  projectId: uuid("projectId").references(() => projects.id, { onDelete: "set null" }),
  pinned: boolean("pinned").notNull().default(false),
  threadId: text("threadId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
