import { pgTable, uuid, text, timestamp, json } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

// Import vector conditionally or just use a custom type if not directly supported by drizzle-orm yet
// Note: pgvector is supported via the `vector` type.
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/\[|\]/g, "").split(",").map(Number);
  },
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  metadata: json("metadata"),
  embedding: vector("embedding"),
  projectId: uuid("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
