import { guard, hasSession } from "@/lib/server/auth";
import {
	MAX_IMAGE_BYTES,
	readProjectImage,
	removeProjectImage,
	saveProjectImage,
	validProjectId,
} from "@/lib/server/projects";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** Proje görseli. Yayındaki projelerin görseli herkese açıktır; gizlilerinki yalnızca oturumla. */
export async function GET(_request: Request, context: Context) {
	const { id } = await context.params;
	if (!validProjectId(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	const image = await readProjectImage(id);
	if (!image || (!image.published && !(await hasSession())))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	return new Response(new Uint8Array(image.bytes), {
		headers: {
			"Content-Type": image.mime,
			"Content-Length": String(image.bytes.length),
			"Content-Disposition": "inline",
			"X-Content-Type-Options": "nosniff",
			"Content-Security-Policy": "default-src 'none'",
			// Adres her güncellemede `?v=` ile değiştiği için uzun süre önbelleklenebilir.
			"Cache-Control": image.published
				? "public, max-age=31536000, immutable"
				: "private, no-store",
		},
	});
}

export async function POST(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 100_000)
		return Response.json({ error: "Görsel en fazla 3 MB olabilir." }, { status: 413 });
	const { id } = await context.params;
	if (!validProjectId(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return Response.json({ error: "Geçersiz dosya." }, { status: 400 });
	}
	const file = form.get("image");
	if (!(file instanceof File))
		return Response.json({ error: "Görsel seçilmedi." }, { status: 400 });
	const result = await saveProjectImage(id, file);
	if ("error" in result)
		return Response.json({ error: result.error }, { status: 400 });
	return Response.json(result);
}

export async function DELETE(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	const { id } = await context.params;
	if (!validProjectId(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	const project = await removeProjectImage(id);
	return project
		? Response.json({ project })
		: Response.json({ error: "Bulunamadı." }, { status: 404 });
}
