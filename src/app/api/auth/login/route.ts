import {
	createSession,
	configured,
	validCredentials,
	sameOrigin,
} from "@/lib/server/auth";

export const runtime = "nodejs";

let attempts = { count: 0, until: 0 };

export async function POST(request: Request) {
	if (!sameOrigin(request))
		return Response.json({ error: "Geçersiz kaynak." }, { status: 403 });
	if (Number(request.headers.get("content-length")) > 8192)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	if (!configured())
		return Response.json(
			{ error: "Önce npm run setup komutunu çalıştır." },
			{ status: 503 },
		);
	const now = Date.now();
	if (attempts.until > now && attempts.count >= 10) {
		return Response.json(
			{ error: "Çok fazla deneme. 15 dakika sonra tekrar dene." },
			{ status: 429 },
		);
	}
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz istek." }, { status: 400 });
	}
	const body = input as { username?: unknown; password?: unknown } | null;
	if (
		!body ||
		typeof body.username !== "string" ||
		typeof body.password !== "string" ||
		body.username.length > 80 ||
		body.password.length > 256
	) {
		return Response.json(
			{ error: "Kullanıcı adı ve parola gerekli." },
			{ status: 400 },
		);
	}
	if (!validCredentials(body.username, body.password)) {
		attempts = {
			count: attempts.until > now ? attempts.count + 1 : 1,
			until: now + 15 * 60_000,
		};
		return Response.json(
			{ error: "Kullanıcı adı veya parola yanlış." },
			{ status: 401 },
		);
	}
	attempts = { count: 0, until: 0 };
	await createSession(request);
	return Response.json({ ok: true });
}
