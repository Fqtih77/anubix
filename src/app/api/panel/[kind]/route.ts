import { guard } from "@/lib/server/auth";
import { create, kindOf, list, validate } from "@/lib/server/entries";

export const runtime = "nodejs";

type Context = { params: Promise<{ kind: string }> };

export async function GET(request: Request, context: Context) {
	const denied = await guard(request);
	if (denied) return denied;
	const kind = kindOf((await context.params).kind);
	if (!kind) return Response.json({ error: "Bulunamadı." }, { status: 404 });
	return Response.json(
		{ items: list(kind) },
		{ headers: { "Cache-Control": "no-store" } },
	);
}

export async function POST(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 32_768)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	const kind = kindOf((await context.params).kind);
	if (!kind) return Response.json({ error: "Bulunamadı." }, { status: 404 });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
	}
	const value = validate(input, kind);
	if (!value)
		return Response.json(
			{ error: "Başlık, açıklama veya tarih geçersiz." },
			{ status: 400 },
		);
	return Response.json({ item: create(kind, value) }, { status: 201 });
}
