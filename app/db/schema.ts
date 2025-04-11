import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  author: text("author").notNull(),
  createdAt: text("created_at").notNull(),
  content: text("content").notNull(),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
  likedAt: text("liked_at"),
});
