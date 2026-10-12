import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { usingSupabase } from "./db";

const BUCKET = "anubix-private";

function client() {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
	return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function localPath(key: string) {
	const dir = process.env.ANUBIX_DATA_DIR || path.join(process.cwd(), ".anubix-data");
	return path.join(/* turbopackIgnore: true */ dir, key);
}

export async function storeFile(key: string, bytes: Uint8Array, mime: string) {
	if (usingSupabase()) {
		const { error } = await client().storage.from(BUCKET).upload(key, bytes, { contentType: mime, upsert: false });
		if (error) throw error;
		return;
	}
	const target = localPath(key);
	await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
	await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
}

export async function loadFile(key: string) {
	if (usingSupabase()) {
		const { data, error } = await client().storage.from(BUCKET).download(key);
		if (error) throw error;
		return Buffer.from(await data.arrayBuffer());
	}
	return readFile(/* turbopackIgnore: true */ localPath(key));
}

export async function deleteFile(key: string) {
	if (usingSupabase()) {
		const { error } = await client().storage.from(BUCKET).remove([key]);
		if (error) throw error;
		return;
	}
	await unlink(localPath(key));
}
