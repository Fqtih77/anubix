import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

let database: DatabaseSync | undefined;

export function db(): DatabaseSync {
	if (database) return database;
	const dir =
		process.env.ANUBIX_DATA_DIR || path.join(process.cwd(), ".anubix-data");
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	const connection = new DatabaseSync(path.join(dir, "anubix.sqlite"));
	connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK(kind IN ('notes','quests','calendar')),
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      date_value TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS entries_kind_date ON entries(kind, date_value);
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('in-progress','completed')),
      period TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      done TEXT NOT NULL DEFAULT '[]',
      planned TEXT NOT NULL DEFAULT '[]',
      tech TEXT NOT NULL DEFAULT '[]',
      github TEXT,
      live TEXT,
      live_note TEXT,
      accent TEXT NOT NULL,
      accent2 TEXT NOT NULL,
      cover TEXT NOT NULL DEFAULT 'letter' CHECK(cover IN ('anubix','letter')),
      image_file TEXT,
      image_mime TEXT,
      image_alt TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS projects_order ON projects(sort_order);
  `);
	database = connection;
	return connection;
}
