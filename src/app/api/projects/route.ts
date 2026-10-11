import { guard, hasSession } from "@/lib/server/auth";
import {
	createProject,
	listProjects,
	reorderProjects,
	toPublic,
	validateProject,
	validProjectId,
} from "@/lib/server/projects";

export const runtime = "nodejs";

/**
 * GET  /api/projects        → herkese açık (yayındaki) projeler
 * GET  /api/projects?all=1  → oturumla: gizliler dahil bütün projeler (panel)
 * POST /api/projects        → oturumla: yeni proje
 * PATCH /api/projects       → oturumla: { order: string[] } ile sıralama
 */
export async function GET(request: Request) {
	const all = new URL(request.url).searchParams.get("all") === "1";
	if (all) {
		if (!(await hasSession()))
			return Response.json({ error: "Oturum gerekli." }, { status: 401 });
		return Response.json(
			{ projects: listProjects({ includeHidden: true }) },
			{ headers: { "Cache-Control": "no-store" } },
		);
	}
	return Response.json(
		{ projects: listProjects().map(toPublic) },
		{ headers: { "Cache-Control": "no-store" } },
	);
}

export async function POST(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 65_536)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
	}
	const result = validateProject(input);
	if ("error" in result)
		return Response.json({ error: result.error }, { status: 400 });
	return Response.json(
		{ project: createProject(result.value) },
		{ status: 201 },
	);
}

export async function PATCH(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 16_384)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
	}
	const order = (input as { order?: unknown } | null)?.order;
	if (
		!Array.isArray(order) ||
		order.length > 200 ||
		!order.every((id) => typeof id === "string" && validProjectId(id))
	)
		return Response.json({ error: "Sıralama geçersiz." }, { status: 400 });
	if (!reorderProjects(order as string[]))
		return Response.json({ error: "Sıralama tüm projeleri birer kez içermeli." }, { status: 400 });
	return Response.json({ projects: listProjects({ includeHidden: true }) });
}
