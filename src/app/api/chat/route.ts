import { randomUUID } from "node:crypto";
import { guard } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";
type Message = {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
};

function history(): Message[] {
	return db()
		.prepare(
			"SELECT id,role,content,created_at AS createdAt FROM messages ORDER BY created_at DESC, rowid DESC LIMIT 40",
		)
		.all()
		.reverse() as Message[];
}

export async function GET(request: Request) {
	const denied = await guard(request);
	if (denied) return denied;
	return Response.json(
		{ messages: history(), available: Boolean(process.env.OLLAMA_MODEL) },
		{ headers: { "Cache-Control": "no-store" } },
	);
}

export async function POST(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	if (Number(request.headers.get("content-length")) > 8192)
		return Response.json({ error: "İstek çok büyük." }, { status: 413 });
	const model = process.env.OLLAMA_MODEL;
	if (!model)
		return Response.json(
			{ error: "Yerel model ayarlanmadı. README'deki Ollama adımlarına bak." },
			{ status: 503 },
		);
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return Response.json({ error: "Geçersiz istek." }, { status: 400 });
	}
	const content = (input as { content?: unknown })?.content;
	if (typeof content !== "string" || !content.trim() || content.length > 4000) {
		return Response.json(
			{ error: "Mesaj 1-4000 karakter olmalı." },
			{ status: 400 },
		);
	}
	const previous = history()
		.slice(-12)
		.map(({ role, content }) => ({ role, content }));
	const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
	let answer: string;
	try {
		const response = await fetch(new URL("/api/chat", base), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model,
				stream: false,
				messages: [
					{
						role: "system",
						content:
							"Sen Anubix'in kişisel yerel asistanı Bix'sin. Türkçe, açık ve dürüst yanıt ver. Kullanıcının özel notlarına veya dosyalarına otomatik erişimin yok.",
					},
					...previous,
					{ role: "user", content: content.trim() },
				],
			}),
			signal: AbortSignal.timeout(60_000),
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
		const data = (await response.json()) as { message?: { content?: string } };
		answer = data.message?.content?.trim() || "";
		if (!answer) throw new Error("Empty Ollama response");
	} catch {
		return Response.json(
			{
				error:
					"Yerel modele ulaşılamadı. Ollama ve modelin çalıştığını kontrol et.",
			},
			{ status: 503 },
		);
	}
	const now = new Date().toISOString();
	const user: Message = {
		id: randomUUID(),
		role: "user",
		content: content.trim(),
		createdAt: now,
	};
	const assistant: Message = {
		id: randomUUID(),
		role: "assistant",
		content: answer.slice(0, 20_000),
		createdAt: new Date().toISOString(),
	};
	const insert = db().prepare(
		"INSERT INTO messages (id,role,content,created_at) VALUES (?,?,?,?)",
	);
	insert.run(user.id, user.role, user.content, user.createdAt);
	insert.run(
		assistant.id,
		assistant.role,
		assistant.content,
		assistant.createdAt,
	);
	return Response.json({ user, assistant });
}

export async function DELETE(request: Request) {
	const denied = await guard(request, true);
	if (denied) return denied;
	db().prepare("DELETE FROM messages").run();
	return Response.json({ ok: true });
}
