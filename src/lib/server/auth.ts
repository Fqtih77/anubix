import "server-only";
import {
	createHash,
	randomBytes,
	scryptSync,
	timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "anubix_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function hash(token: string) {
	// Parola yenilenince eski oturumlar da geçersiz kalsın.
	return createHash("sha256")
		.update(process.env.ANUBIX_ADMIN_PASSWORD_HASH || "")
		.update(":")
		.update(token)
		.digest("hex");
}

export function configured() {
	return Boolean(
		process.env.ANUBIX_ADMIN_USERNAME && process.env.ANUBIX_ADMIN_PASSWORD_HASH,
	);
}

export function validCredentials(username: string, password: string) {
	const encoded = process.env.ANUBIX_ADMIN_PASSWORD_HASH || "";
	const [salt, expected] = encoded.split(":");
	const usernameOk = username === process.env.ANUBIX_ADMIN_USERNAME;
	if (
		!salt ||
		!expected ||
		!/^[a-f0-9]{32}$/.test(salt) ||
		!/^[a-f0-9]{128}$/.test(expected)
	)
		return false;
	const actual = scryptSync(password, Buffer.from(salt, "hex"), 64);
	return usernameOk && timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

export async function createSession(request: Request) {
	const token = randomBytes(32).toString("base64url");
	const expiresAt = Date.now() + SESSION_SECONDS * 1000;
	db().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
	db()
		.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)")
		.run(hash(token), expiresAt);
	(await cookies()).set(COOKIE, token, {
		httpOnly: true,
		secure: process.env.ANUBIX_HTTPS === "true" || new URL(request.headers.get("origin") || request.url).protocol === "https:",
		sameSite: "strict",
		path: "/",
		maxAge: SESSION_SECONDS,
	});
}

export async function hasSession() {
	if (!configured()) return false;
	const token = (await cookies()).get(COOKIE)?.value;
	if (!token) return false;
	const row = db()
		.prepare("SELECT expires_at FROM sessions WHERE token_hash = ?")
		.get(hash(token)) as { expires_at: number } | undefined;
	return Boolean(row && row.expires_at > Date.now());
}

export async function clearSession() {
	const token = (await cookies()).get(COOKIE)?.value;
	if (token)
		db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(token));
	(await cookies()).delete(COOKIE);
}

export function sameOrigin(request: Request) {
	const origin = request.headers.get("origin");
	if (!origin) return false;
	try {
		const given = new URL(origin);
		const host = request.headers.get("host");
		const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.slice(0, -1);
		return given.host === host && given.protocol === `${protocol}:`;
	} catch {
		return false;
	}
}

export async function guard(request: Request, mutate = false) {
	if (mutate && !sameOrigin(request))
		return Response.json({ error: "Geçersiz kaynak." }, { status: 403 });
	if (!(await hasSession()))
		return Response.json({ error: "Oturum gerekli." }, { status: 401 });
	return null;
}
