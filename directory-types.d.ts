declare module "app" {}
declare module "node_modules" {}
declare module "public" {}
declare module "scripts" {}

declare module "better-sqlite3" {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
  }

  interface Statement {
    run(...params: any[]): { lastInsertRowid: number | bigint };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  export default function (filename: string, options?: any): Database;
}
