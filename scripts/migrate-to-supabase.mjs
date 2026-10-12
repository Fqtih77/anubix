import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const directory = process.env.ANUBIX_DATA_DIR || path.join(process.cwd(), ".anubix-data");
const source = path.join(directory, "anubix.sqlite");
const databaseUrl = process.env.SUPABASE_DB_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!existsSync(source)) throw new Error(`SQLite kaynağı bulunamadı: ${source}`);
if (!databaseUrl || !supabaseUrl || !secretKey)
  throw new Error("SUPABASE_DB_URL, SUPABASE_URL ve SUPABASE_SECRET_KEY gerekli.");

const sqlite = new DatabaseSync(source, { readOnly: true });
const postgres = new pg.Client({ connectionString: databaseUrl, ssl: true });
const storage = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } }).storage.from("anubix-private");

const tables = {
  entries: ["id", "kind", "title", "body", "date_value", "done", "created_at", "updated_at"],
  files: ["id", "original_name", "stored_name", "mime", "size", "created_at"],
  messages: ["id", "role", "content", "created_at"],
  settings: ["key", "value"],
  projects: ["id", "title", "tagline", "status", "period", "summary", "description", "done", "planned", "tech", "github", "live", "live_note", "accent", "accent2", "cover", "image_file", "image_mime", "image_alt", "sort_order", "published", "created_at", "updated_at"],
};

try {
  await postgres.connect();
  for (const [table, columns] of Object.entries(tables)) {
    const present = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!present) continue;
    const rows = sqlite.prepare(`SELECT ${columns.join(",")} FROM ${table}`).all();
    let inserted = 0;
    for (const row of rows) {
      const values = columns.map((column) => row[column]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
      const result = await postgres.query(`INSERT INTO public.${table} (${columns.join(",")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
      inserted += result.rowCount ?? 0;
    }
    console.log(`${table}: ${inserted}/${rows.length} yeni kayıt`);
  }

  const assets = [
    ...sqlite.prepare("SELECT stored_name AS name, mime FROM files").all().map((r) => ({ key: `uploads/${r.name}`, mime: r.mime })),
    ...sqlite.prepare("SELECT image_file AS name, image_mime AS mime FROM projects WHERE image_file IS NOT NULL").all().map((r) => ({ key: `project-images/${r.name}`, mime: r.mime })),
  ];
  for (const asset of assets) {
    const file = path.join(directory, asset.key);
    if (!existsSync(file)) throw new Error(`Dosya bulunamadı: ${file}`);
    const { error } = await storage.upload(asset.key, readFileSync(file), { contentType: asset.mime || "application/octet-stream", upsert: true });
    if (error) throw error;
  }
  console.log(`${assets.length} dosya aktarıldı. Kaynak SQLite yerinde bırakıldı.`);
} finally {
  await postgres.end();
  sqlite.close();
}
