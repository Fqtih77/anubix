import { guard } from "@/lib/server/auth";
import { kindOf, remove, update, validate } from "@/lib/server/entries";

export const runtime = "nodejs";

type Context = { params: Promise<{ kind: string; id: string }> };

export async function PUT(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 32_768)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	const { kind: raw, id } = await context.params;
	const kind = kindOf(raw);
	if (!kind || !/^[0-9a-f-]{36}$/.test(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
	}
	const value = validate(input, kind);
	if (!value)
		return Response.json({ error: "Geçersiz veri." }, { status: 400 });
	const item = update(kind, id, value);
	return item
		? Response.json({ item })
		: Response.json({ error: "Bulunamadı." }, { status: 404 });
}

export async function DELETE(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	const { kind: raw, id } = await context.params;
	const kind = kindOf(raw);
	if (!kind || !/^[0-9a-f-]{36}$/.test(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	return remove(kind, id)
		? Response.json({ ok: true })
		: Response.json({ error: "Bulunamadı." }, { status: 404 });
}
