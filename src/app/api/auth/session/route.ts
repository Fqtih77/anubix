import { configured, hasSession } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
	return Response.json(
		{ configured: configured(), authenticated: await hasSession() },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
