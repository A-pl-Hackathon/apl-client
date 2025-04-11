declare module "drizzle-orm" {
  export * from "drizzle-orm/better-sqlite3";
  export const eq: any;
}

declare module "drizzle-orm/sqlite-core" {
  export function sqliteTable(name: string, columns: any): any;
  export function text(name: string): any;
  export function integer(name: string): any;
}

declare module "drizzle-orm/better-sqlite3" {
  export function drizzle(db: any, options?: any): any;
}

declare module "drizzle-orm/better-sqlite3/migrator" {
  export function migrate(db: any, options: any): void;
}
