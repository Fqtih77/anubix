import { guard } from "@/lib/server/auth";
import {
	deleteProject,
	updateProject,
	validateProject,
	validProjectId,
} from "@/lib/server/projects";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 65_536)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	const { id } = await context.params;
	if (!validProjectId(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
	}
	const result = validateProject(input);
	if ("error" in result)
		return Response.json({ error: result.error }, { status: 400 });
	const project = await updateProject(id, result.value);
	return project
		? Response.json({ project })
		: Response.json({ error: "Bulunamadı." }, { status: 404 });
}

export async function DELETE(request: Request, context: Context) {
	const denied = await guard(request, true);
	if (denied) return denied;
	const { id } = await context.params;
	if (!validProjectId(id))
		return Response.json({ error: "Bulunamadı." }, { status: 404 });
	return (await deleteProject(id))
		? Response.json({ ok: true })
		: Response.json({ error: "Bulunamadı." }, { status: 404 });
}
