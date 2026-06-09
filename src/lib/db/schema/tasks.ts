import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { conversations } from "./conversations";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  priority: text("priority"),
  dueDate: timestamp("dueDate"),
  projectId: uuid("projectId").references(() => projects.id, { onDelete: "set null" }),
  sourceConversationId: uuid("sourceConversationId").references(() => conversations.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
