import { guard } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { deleteFile, loadFile } from "@/lib/server/storage";
import { fileKey } from "../route";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
type FileRow = {
	original_name: string;
	stored_name: string;
	mime: string;
	size: number;
};

async function get(id: string) {
	if (!/^[0-9a-f-]{36}$/.test(id)) return null;
	return await db()
		.prepare("SELECT original_name,stored_name,mime,size FROM files WHERE id=?")
		.get(id) as FileRow | undefined;
}

export async function GET(request: Request, context: Context) {
	const denied = await guard(request);
	if (denied) return denied;
	const row = await get((await context.params).id);
	if (!row) return Response.json({ error: "Bulunamadı." }, { status: 404 });
	try {
		const bytes = await loadFile(fileKey(row.stored_name));
		return new Response(new Uint8Array(bytes), {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": String(bytes.length),
				"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.original_name)}`,
				"X-Content-Type-Options": "nosniff",
				"Cache-Control": "no-store",
			},
		});
	} catch {
		return Response.json({ error: "Dosya bulunamadı." }, { status: 404 });
	}
}

export async function DELETE(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	const id = (await context.params).id;
	const row = await get(id);
	if (!row) return Response.json({ error: "Bulunamadı." }, { status: 404 });
	await db().prepare("DELETE FROM files WHERE id=?").run(id);
	await deleteFile(fileKey(row.stored_name)).catch(() => {});
	return Response.json({ ok: true });
}
