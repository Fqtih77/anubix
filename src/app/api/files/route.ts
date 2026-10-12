import { randomUUID } from "node:crypto";
import path from "node:path";
import { guard } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { deleteFile, storeFile } from "@/lib/server/storage";

export const runtime = "nodejs";
const MAX_FILE_MB = Number(process.env.NEXT_PUBLIC_FILE_MAX_MB || 10);
const MAX_FILE = MAX_FILE_MB * 1024 * 1024;
const MAX_TOTAL = 100 * 1024 * 1024;

export const fileKey = (name: string) => `uploads/${name}`;

export async function GET(request: Request) {
	const denied = await guard(request);
	if (denied) return denied;
	const files = await db()
		.prepare(
			"SELECT id, original_name AS name, mime, size, created_at AS createdAt FROM files ORDER BY created_at DESC",
		)
		.all();
	return Response.json({ files }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > MAX_FILE + 100_000) {
		return Response.json(
			{ error: `Dosya en fazla ${MAX_FILE_MB} MB olabilir.` },
			{ status: 413 },
		);
	}
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return Response.json({ error: "Geçersiz dosya." }, { status: 400 });
	}
	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE) {
		return Response.json(
			{ error: `1 byte ile ${MAX_FILE_MB} MB arasında dosya seç.` },
			{ status: 400 },
		);
	}
	const name = [...path.basename(file.name)]
		.filter(
			(character) =>
				character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
		)
		.join("")
		.slice(0, 180);
	if (!name)
		return Response.json({ error: "Dosya adı geçersiz." }, { status: 400 });
	const used = await db()
		.prepare("SELECT COALESCE(SUM(size),0) AS used FROM files")
		.get() as { used: number };
	if (Number(used.used) + file.size > MAX_TOTAL)
		return Response.json(
			{ error: "Depo 100 MB sınırına ulaştı." },
			{ status: 413 },
		);
	const id = randomUUID();
	const stored = randomUUID();
	await storeFile(fileKey(stored), new Uint8Array(await file.arrayBuffer()), file.type || "application/octet-stream");
	const now = new Date().toISOString();
	try {
		await db()
			.prepare(
				"INSERT INTO files (id,original_name,stored_name,mime,size,created_at) VALUES (?,?,?,?,?,?)",
			)
			.run(
				id,
				name,
				stored,
				file.type || "application/octet-stream",
				file.size,
				now,
			);
	} catch (error) {
		await deleteFile(fileKey(stored));
		throw error;
	}
	return Response.json(
		{ file: { id, name, size: file.size, createdAt: now } },
		{ status: 201 },
	);
}
