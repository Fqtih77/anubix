import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

type Result = { changes: number };
type Statement = {
	all: (...values: unknown[]) => Promise<Record<string, unknown>[]>;
	get: (...values: unknown[]) => Promise<Record<string, unknown> | undefined>;
	run: (...values: unknown[]) => Promise<Result>;
};

let local: DatabaseSync | undefined;
let pool: pg.Pool | undefined;

export function usingSupabase() {
	return Boolean(process.env.SUPABASE_DB_URL);
}

function sqlite() {
	if (local) return local;
	const dir = process.env.ANUBIX_DATA_DIR || path.join(process.cwd(), ".anubix-data");
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	const connection = new DatabaseSync(path.join(dir, "anubix.sqlite"));
	connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('notes','quests','calendar')), title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', date_value TEXT, done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS entries_kind_date ON entries(kind, date_value);
    CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, original_name TEXT NOT NULL, stored_name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT NOT NULL, tagline TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('in-progress','completed')), period TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', done TEXT NOT NULL DEFAULT '[]', planned TEXT NOT NULL DEFAULT '[]', tech TEXT NOT NULL DEFAULT '[]', github TEXT, live TEXT, live_note TEXT, accent TEXT NOT NULL, accent2 TEXT NOT NULL, cover TEXT NOT NULL DEFAULT 'letter' CHECK(cover IN ('anubix','letter')), image_file TEXT, image_mime TEXT, image_alt TEXT, sort_order INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS projects_order ON projects(sort_order);
  `);
	local = connection;
	return connection;
}

function postgres() {
	if (pool) return pool;
	const connectionString = process.env.SUPABASE_DB_URL;
	if (!connectionString) throw new Error("SUPABASE_DB_URL is required");
	const url = new URL(connectionString);
	const localHost = ["localhost", "127.0.0.1"].includes(url.hostname);
	// Supabase's shared pooler uses a CA outside Node's default trust store.
	// libpq's "require" mode keeps the connection encrypted without requiring its CA.
	// An explicit sslrootcert/verify-full setting still takes precedence.
	if (!localHost && !url.searchParams.has("sslrootcert")) {
		if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
		if (url.searchParams.get("sslmode") === "require")
			url.searchParams.set("uselibpqcompat", "true");
	}
	pool = new pg.Pool({ connectionString: url.toString(), max: 1, ssl: !localHost });
	return pool;
}

function pgSql(sql: string) {
	let n = 0;
	return sql.replace(/\?/g, () => `$${++n}`).replace(/^INSERT OR IGNORE INTO /i, "INSERT INTO ");
}

export function db() {
	return {
		prepare(sql: string): Statement {
			async function execute(values: unknown[]) {
				if (usingSupabase()) {
					const statement = pgSql(sql);
					const query = /^INSERT OR IGNORE INTO /i.test(sql) ? `${statement} ON CONFLICT DO NOTHING` : statement;
					return postgres().query(query, values);
				}
				const statement = sqlite().prepare(sql);
				const sqliteValues = values as (string | number | bigint | null | Uint8Array)[];
				if (/^\s*SELECT\b/i.test(sql)) return { rows: statement.all(...sqliteValues) as Record<string, unknown>[], rowCount: 0 };
				const result = statement.run(...sqliteValues);
				return { rows: [] as Record<string, unknown>[], rowCount: Number(result.changes) };
			}
			return {
				async all(...values) { return (await execute(values)).rows; },
				async get(...values) { return (await execute(values)).rows[0]; },
				async run(...values) { return { changes: (await execute(values)).rowCount ?? 0 }; },
			};
		},
	};
}
