export interface Post {
  id?: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id?: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  likedAt: string | null;
}

export function formatDateKST() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // KST is UTC+9
  return now.toISOString().replace("T", " ").substring(0, 19);
}

type SqlJsDb = any;
type SqlJsStatic = any;

let isDbInitialized = false;

let postsCache: Post[] = [];
let commentsCache: Comment[] = [];
let lastPostId = 0;
let lastCommentId = 0;

class LiteDatabase {
  private db: SqlJsDb | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitializing = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    if (this.isInitializing || isDbInitialized) return;
    this.isInitializing = true;

    try {
      const initSqlJs = (await import("sql.js")).default;
      this.SQL = await initSqlJs();

      this.db = new this.SQL.Database();

      this.createTables();

      isDbInitialized = true;
      console.log("SQL.js database initialization completed");

      if (postsCache.length > 0 || commentsCache.length > 0) {
        this.migrateFromCache();
      }
    } catch (error) {
      console.error("SQL.js database initialization error:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  private createTables() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        postId INTEGER NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        readAt TEXT,
        likedAt TEXT,
        FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE
      );
    `);
  }

  private migrateFromCache() {
    for (const post of postsCache) {
      this.createPost(post);
    }

    for (const comment of commentsCache) {
      this.createComment(comment);
    }

    postsCache = [];
    commentsCache = [];
  }

  getAllPosts(): Post[] {
    if (!this.db || !isDbInitialized) return postsCache;

    try {
      const result = this.db.exec(
        "SELECT * FROM posts ORDER BY createdAt DESC"
      );
      if (result.length === 0) return [];

      return result[0].values.map((row: any[], idx: number) => ({
        id: row[0] as number,
        author: row[1] as string,
        content: row[2] as string,
        createdAt: row[3] as string,
      }));
    } catch (error) {
      console.error("Post retrieval error:", error);
      return postsCache;
    }
  }

  getPostById(id: number): Post | null {
    if (!this.db || !isDbInitialized) {
      return postsCache.find((post) => post.id === id) || null;
    }

    try {
      const stmt = this.db.prepare("SELECT * FROM posts WHERE id = :id");
      stmt.bind({ ":id": id });

      if (!stmt.step()) {
        stmt.free();
        return null;
      }

      const row = stmt.getAsObject();
      stmt.free();

      return {
        id: row.id as number,
        author: row.author as string,
        content: row.content as string,
        createdAt: row.createdAt as string,
      };
    } catch (error) {
      console.error(`Post retrieval error for ID ${id}:`, error);
      return null;
    }
  }

  createPost(post: Omit<Post, "id">): Post {
    if (!this.db || !isDbInitialized) {
      const newId = ++lastPostId;
      const newPost = { ...post, id: newId };
      postsCache.push(newPost);
      return newPost;
    }

    try {
      const createdAt = post.createdAt || formatDateKST();
      const stmt = this.db.prepare(
        "INSERT INTO posts (author, content, createdAt) VALUES (:author, :content, :createdAt)"
      );
      stmt.bind({
        ":author": post.author,
        ":content": post.content,
        ":createdAt": createdAt,
      });

      stmt.step();
      stmt.free();

      const result = this.db.exec("SELECT last_insert_rowid()");
      const newId = result[0].values[0][0] as number;

      return { ...post, id: newId };
    } catch (error) {
      console.error("Post creation error:", error);
      throw error;
    }
  }

  deletePost(id: number): boolean {
    if (!this.db || !isDbInitialized) {
      const initialLength = postsCache.length;
      postsCache = postsCache.filter((post) => post.id !== id);

      commentsCache = commentsCache.filter((comment) => comment.postId !== id);

      return postsCache.length < initialLength;
    }

    try {
      const deleteCommentsStmt = this.db.prepare(
        "DELETE FROM comments WHERE postId = :id"
      );
      deleteCommentsStmt.bind({ ":id": id });
      deleteCommentsStmt.step();
      deleteCommentsStmt.free();

      const deletePostStmt = this.db.prepare(
        "DELETE FROM posts WHERE id = :id"
      );
      deletePostStmt.bind({ ":id": id });
      deletePostStmt.step();
      deletePostStmt.free();

      const countBefore = this.db.exec("SELECT COUNT(*) FROM posts")[0]
        .values[0][0] as number;

      return true;
    } catch (error) {
      console.error(`Post deletion error for ID ${id}:`, error);
      return false;
    }
  }

  getCommentsByPostId(postId: number): Comment[] {
    if (!this.db || !isDbInitialized) {
      return commentsCache.filter((comment) => comment.postId === postId);
    }

    try {
      const stmt = this.db.prepare(
        "SELECT * FROM comments WHERE postId = :postId ORDER BY createdAt ASC"
      );
      stmt.bind({ ":postId": postId });

      const comments: Comment[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        comments.push({
          id: row.id as number,
          postId: row.postId as number,
          author: row.author as string,
          content: row.content as string,
          createdAt: row.createdAt as string,
          readAt: row.readAt as string | null,
          likedAt: row.likedAt as string | null,
        });
      }

      stmt.free();
      return comments;
    } catch (error) {
      console.error(`Comment retrieval error for post ID ${postId}:`, error);
      return [];
    }
  }

  getCommentById(id: number): Comment | null {
    if (!this.db || !isDbInitialized) {
      return commentsCache.find((comment) => comment.id === id) || null;
    }

    try {
      const stmt = this.db.prepare("SELECT * FROM comments WHERE id = :id");
      stmt.bind({ ":id": id });

      if (!stmt.step()) {
        stmt.free();
        return null;
      }

      const row = stmt.getAsObject();
      stmt.free();

      return {
        id: row.id as number,
        postId: row.postId as number,
        author: row.author as string,
        content: row.content as string,
        createdAt: row.createdAt as string,
        readAt: row.readAt as string | null,
        likedAt: row.likedAt as string | null,
      };
    } catch (error) {
      console.error(`Comment retrieval error for ID ${id}:`, error);
      return null;
    }
  }

  createComment(comment: Omit<Comment, "id">): Comment {
    if (!this.db || !isDbInitialized) {
      const newId = ++lastCommentId;
      const newComment = { ...comment, id: newId };
      commentsCache.push(newComment);
      return newComment;
    }

    try {
      const createdAt = comment.createdAt || formatDateKST();
      const stmt = this.db.prepare(
        "INSERT INTO comments (postId, author, content, createdAt, readAt, likedAt) VALUES (:postId, :author, :content, :createdAt, :readAt, :likedAt)"
      );

      stmt.bind({
        ":postId": comment.postId,
        ":author": comment.author,
        ":content": comment.content,
        ":createdAt": createdAt,
        ":readAt": comment.readAt,
        ":likedAt": comment.likedAt,
      });

      stmt.step();
      stmt.free();

      const result = this.db.exec("SELECT last_insert_rowid()");
      const newId = result[0].values[0][0] as number;

      return { ...comment, id: newId };
    } catch (error) {
      console.error("Comment creation error:", error);
      throw error;
    }
  }

  updateCommentMetadata(
    id: number,
    action: "read" | "unread" | "like" | "unlike"
  ): boolean {
    if (!this.db || !isDbInitialized) {
      const commentIndex = commentsCache.findIndex(
        (comment) => comment.id === id
      );
      if (commentIndex === -1) return false;

      const now = formatDateKST();

      switch (action) {
        case "read":
          commentsCache[commentIndex].readAt = now;
          break;
        case "unread":
          commentsCache[commentIndex].readAt = null;
          break;
        case "like":
          commentsCache[commentIndex].likedAt = now;
          break;
        case "unlike":
          commentsCache[commentIndex].likedAt = null;
          break;
        default:
          return false;
      }

      return true;
    }

    try {
      let query = "";
      let param: any = { ":id": id };

      switch (action) {
        case "read":
          query = "UPDATE comments SET readAt = :datetime WHERE id = :id";
          param[":datetime"] = formatDateKST();
          break;
        case "unread":
          query = "UPDATE comments SET readAt = NULL WHERE id = :id";
          break;
        case "like":
          query = "UPDATE comments SET likedAt = :datetime WHERE id = :id";
          param[":datetime"] = formatDateKST();
          break;
        case "unlike":
          query = "UPDATE comments SET likedAt = NULL WHERE id = :id";
          break;
        default:
          return false;
      }

      const stmt = this.db.prepare(query);
      stmt.bind(param);
      stmt.step();
      stmt.free();

      return true;
    } catch (error) {
      console.error(`Comment metadata update error for ID ${id}:`, error);
      return false;
    }
  }

  deleteComment(id: number): boolean {
    if (!this.db || !isDbInitialized) {
      const initialLength = commentsCache.length;
      commentsCache = commentsCache.filter((comment) => comment.id !== id);
      return commentsCache.length < initialLength;
    }

    try {
      const stmt = this.db.prepare("DELETE FROM comments WHERE id = :id");
      stmt.bind({ ":id": id });
      stmt.step();
      stmt.free();

      return true;
    } catch (error) {
      console.error(`Comment deletion error for ID ${id}:`, error);
      return false;
    }
  }

  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    try {
      return this.db.export();
    } catch (error) {
      console.error("Database export error:", error);
      return null;
    }
  }
}

const liteDb = new LiteDatabase();
export default liteDb;
