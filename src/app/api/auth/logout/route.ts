import { clearSession, guard } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	await clearSession();
	return Response.json({ ok: true });
}
