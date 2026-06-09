import { pgTable, text, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return '[' + value.join(',') + ']';
  },
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  embedding: vector("embedding"),
  projectId: uuid("projectId").references(() => projects.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
