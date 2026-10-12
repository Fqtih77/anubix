import "server-only";
import { randomUUID } from "node:crypto";
import {
	type CoverMotif,
	defaultProjects,
	type Project,
	type ProjectStatus,
} from "@/data/projects";
import { db } from "./db";
import { deleteFile, loadFile, storeFile } from "./storage";

/**
 * PROJELER (sunucu)
 * -----------------
 * Odadaki proje masaüstü, tanıtım ekranı ve hızlı liste bu tablodan beslenir.
 * Paneldeki "Komut bloğu" aşağıdaki fonksiyonları API üzerinden çağırır.
 * Veritabanı ilk kez kullanıldığında `src/data/projects.ts` içindeki başlangıç
 * projeleri bir kez içeri aktarılır.
 */

/** Panelde gereken ek alanlarla proje kaydı. */
export interface ProjectRecord extends Project {
	published: boolean;
	sortOrder: number;
	hasImage: boolean;
	/** Panelde düzenlenen ham görsel açıklaması (boş olabilir) */
	imageAlt: string;
	updatedAt: string;
}

/** Panelden gelen, doğrulanmış proje verisi. */
export interface ProjectInput {
	title: string;
	tagline: string;
	status: ProjectStatus;
	period: string;
	summary: string;
	description: string;
	done: string[];
	planned: string[];
	tech: string[];
	github: string;
	live: string;
	liveNote: string;
	accent: string;
	accent2: string;
	imageAlt: string;
	published: boolean;
}

type Row = {
	id: string;
	title: string;
	tagline: string;
	status: ProjectStatus;
	period: string;
	summary: string;
	description: string;
	done: string;
	planned: string;
	tech: string;
	github: string | null;
	live: string | null;
	live_note: string | null;
	accent: string;
	accent2: string;
	cover: CoverMotif;
	image_file: string | null;
	image_mime: string | null;
	image_alt: string | null;
	sort_order: number;
	published: number;
	created_at: string;
	updated_at: string;
};

const COLUMNS =
	"id,title,tagline,status,period,summary,description,done,planned,tech,github,live,live_note,accent,accent2,cover,image_file,image_mime,image_alt,sort_order,published,created_at,updated_at";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const imageKey = (name: string) => `project-images/${name}`;

function parseList(json: string): string[] {
	try {
		const value = JSON.parse(json);
		return Array.isArray(value)
			? value.filter((item): item is string => typeof item === "string")
			: [];
	} catch {
		return [];
	}
}

function toRecord(r: Row): ProjectRecord {
	return {
		id: r.id,
		title: r.title,
		tagline: r.tagline,
		status: r.status,
		period: r.period || undefined,
		summary: r.summary,
		description: r.description,
		done: parseList(r.done),
		planned: parseList(r.planned),
		tech: parseList(r.tech),
		links: { github: r.github || undefined, live: r.live || undefined },
		liveNote: r.live_note || undefined,
		accent: r.accent,
		accent2: r.accent2,
		cover: r.cover,
		image: r.image_file
			? {
					src: `/api/projects/${r.id}/image?v=${encodeURIComponent(r.updated_at)}`,
					alt: r.image_alt || `${r.title} görseli`,
				}
			: undefined,
		published: Boolean(r.published),
		sortOrder: r.sort_order,
		hasImage: Boolean(r.image_file),
		imageAlt: r.image_alt || "",
		updatedAt: r.updated_at,
	};
}

/** Herkese açık görünüm: yalnızca panelin ihtiyaç duyduğu alanlar ayıklanır. */
export function toPublic(p: ProjectRecord): Project {
	return {
		id: p.id,
		title: p.title,
		tagline: p.tagline,
		status: p.status,
		period: p.period,
		summary: p.summary,
		description: p.description,
		done: p.done,
		planned: p.planned,
		tech: p.tech,
		links: p.links,
		liveNote: p.liveNote,
		accent: p.accent,
		accent2: p.accent2,
		cover: p.cover,
		image: p.image,
	};
}

/** İlk kullanımda başlangıç projelerini bir kez içeri aktarır. */
async function ensureSeeded() {
	const connection = db();
	const seeded = await connection
		.prepare("SELECT value FROM settings WHERE key = 'projects_seeded'")
		.get();
	if (seeded) return;
	const now = new Date().toISOString();
	const insert = connection.prepare(
		`INSERT OR IGNORE INTO projects (${COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
	);
	for (const [index, p] of defaultProjects.entries()) {
			await insert.run(
				p.id,
				p.title,
				p.tagline,
				p.status,
				p.period ?? "",
				p.summary,
				p.description,
				JSON.stringify(p.done),
				JSON.stringify(p.planned),
				JSON.stringify(p.tech),
				p.links.github ?? null,
				p.links.live ?? null,
				p.liveNote ?? null,
				p.accent,
				p.accent2,
				p.cover,
				null,
				null,
				null,
				index,
				1,
				now,
				now,
			);
	}
	await connection
		.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('projects_seeded', ?)")
		.run(now);
	}


export async function listProjects(options: { includeHidden?: boolean } = {}): Promise<ProjectRecord[]> {
	await ensureSeeded();
	const where = options.includeHidden ? "" : "WHERE published = 1";
	return (
		await db()
			.prepare(`SELECT ${COLUMNS} FROM projects ${where} ORDER BY sort_order, created_at`)
			.all() as Row[]
	).map(toRecord);
}

/** Veritabanı okunamazsa gizlenmiş projeleri yanlışlıkla yayımlama. */
export async function publicProjects(): Promise<Project[]> {
	try {
		return (await listProjects()).map(toPublic);
	} catch (error) {
		console.error("Projeler veritabanından okunamadı:", error);
		return [];
	}
}

async function getRow(id: string): Promise<Row | undefined> {
	await ensureSeeded();
	return await db().prepare(`SELECT ${COLUMNS} FROM projects WHERE id = ?`).get(id) as
		| Row
		| undefined;
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
	const row = await getRow(id);
	return row ? toRecord(row) : null;
}

export const validProjectId = (id: string) => /^[a-z0-9-]{1,60}$/.test(id);

/* ---------- Doğrulama ---------- */

function text(value: unknown, max: number, field: string, required = false) {
	if (value === undefined || value === null) value = "";
	if (typeof value !== "string") throw new Error(`${field} metin olmalı.`);
	const trimmed = value.trim();
	if (required && !trimmed) throw new Error(`${field} boş olamaz.`);
	if (trimmed.length > max) throw new Error(`${field} en fazla ${max} karakter olabilir.`);
	return trimmed;
}

function list(value: unknown, field: string, maxItems = 20, maxLength = 160) {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) throw new Error(`${field} bir liste olmalı.`);
	const items = value
		.map((item) => {
			if (typeof item !== "string") throw new Error(`${field} yalnızca metin içerebilir.`);
			return item.trim();
		})
		.filter(Boolean);
	if (items.length > maxItems) throw new Error(`${field} en fazla ${maxItems} öğe olabilir.`);
	if (items.some((item) => item.length > maxLength))
		throw new Error(`${field} öğeleri en fazla ${maxLength} karakter olabilir.`);
	return items;
}

function url(value: unknown, field: string, hosts?: string[]) {
	const raw = text(value, 300, field);
	if (!raw) return "";
	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		throw new Error(`${field} geçerli bir adres olmalı (https://…).`);
	}
	if (parsed.protocol !== "https:")
		throw new Error(`${field} https:// ile başlamalı.`);
	if (hosts && !hosts.includes(parsed.hostname))
		throw new Error(`${field} ${hosts[0]} adresi olmalı.`);
	return parsed.toString();
}

function color(value: unknown, field: string) {
	if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value))
		throw new Error(`${field} #RRGGBB biçiminde olmalı.`);
	return value.toLowerCase();
}

/** Panelden gelen veriyi doğrular. Hata varsa açıklayıcı Türkçe mesaj döner. */
export function validateProject(
	input: unknown,
): { value: ProjectInput } | { error: string } {
	if (!input || typeof input !== "object") return { error: "Geçersiz veri." };
	const v = input as Record<string, unknown>;
	try {
		if (v.status !== "in-progress" && v.status !== "completed")
			throw new Error("Durum geçersiz.");
		if (v.published !== undefined && typeof v.published !== "boolean")
			throw new Error("Yayın durumu geçersiz.");
		return {
			value: {
				title: text(v.title, 80, "Proje adı", true),
				tagline: text(v.tagline, 120, "Kısa açıklama"),
				status: v.status,
				period: text(v.period, 60, "Dönem"),
				summary: text(v.summary, 600, "Özet", true),
				description: text(v.description, 4000, "Ayrıntılı açıklama"),
				done: list(v.done, "Neler var"),
				planned: list(v.planned, "Planlananlar"),
				tech: list(v.tech, "Teknolojiler", 20, 40),
				github: url(v.github, "GitHub bağlantısı", ["github.com", "www.github.com"]),
				live: url(v.live, "Canlı demo bağlantısı"),
				liveNote: text(v.liveNote, 120, "Canlı bağlantı notu"),
				accent: color(v.accent, "Ana renk"),
				accent2: color(v.accent2, "İkinci renk"),
				imageAlt: text(v.imageAlt, 160, "Görsel açıklaması"),
				published: v.published !== false,
			},
		};
	} catch (error) {
		return { error: (error as Error).message };
	}
}

/* ---------- Yazma işlemleri ---------- */

function slugify(title: string) {
	const map: Record<string, string> = {
		ç: "c",
		ğ: "g",
		ı: "i",
		ö: "o",
		ş: "s",
		ü: "u",
		â: "a",
		î: "i",
		û: "u",
	};
	const slug = title
		.toLocaleLowerCase("tr-TR")
		.replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c)
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return slug || "proje";
}

async function uniqueId(base: string) {
	let id = base;
	for (let n = 2; await getRow(id); n++) id = `${base}-${n}`;
	return id;
}

export async function createProject(value: ProjectInput): Promise<ProjectRecord> {
	await ensureSeeded();
	const connection = db();
	const id = await uniqueId(slugify(value.title));
	const now = new Date().toISOString();
	const { next } = await connection
		.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM projects")
		.get() as { next: number };
	await connection
		.prepare(
			`INSERT INTO projects (${COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		)
		.run(
			id,
			value.title,
			value.tagline,
			value.status,
			value.period,
			value.summary,
			value.description,
			JSON.stringify(value.done),
			JSON.stringify(value.planned),
			JSON.stringify(value.tech),
			value.github || null,
			value.live || null,
			value.liveNote || null,
			value.accent,
			value.accent2,
			"letter",
			null,
			null,
			value.imageAlt || null,
			next,
			value.published ? 1 : 0,
			now,
			now,
		);
	return (await getProject(id)) as ProjectRecord;
}

export async function updateProject(id: string, value: ProjectInput): Promise<ProjectRecord | null> {
	const result = await db()
		.prepare(
			"UPDATE projects SET title=?,tagline=?,status=?,period=?,summary=?,description=?,done=?,planned=?,tech=?,github=?,live=?,live_note=?,accent=?,accent2=?,image_alt=?,published=?,updated_at=? WHERE id=?",
		)
		.run(
			value.title,
			value.tagline,
			value.status,
			value.period,
			value.summary,
			value.description,
			JSON.stringify(value.done),
			JSON.stringify(value.planned),
			JSON.stringify(value.tech),
			value.github || null,
			value.live || null,
			value.liveNote || null,
			value.accent,
			value.accent2,
			value.imageAlt || null,
			value.published ? 1 : 0,
			new Date().toISOString(),
			id,
		);
	return result.changes ? getProject(id) : null;
}

export async function deleteProject(id: string) {
	const row = await getRow(id);
	if (!row) return false;
	await db().prepare("DELETE FROM projects WHERE id = ?").run(id);
	if (row.image_file)
		await deleteFile(imageKey(row.image_file)).catch(() => {});
	return true;
}

/** Bütün projeleri, her ID tam bir kez geçecek şekilde yeniden sıralar. */
export async function reorderProjects(ids: string[]): Promise<boolean> {
	await ensureSeeded();
	const connection = db();
	const current = await connection.prepare("SELECT id FROM projects").all() as { id: string }[];
	const known = new Set(current.map((project) => project.id));
	if (ids.length !== known.size || new Set(ids).size !== ids.length || ids.some((id) => !known.has(id)))
		return false;
	if (!ids.length) return true;
	const cases = ids.map(() => "WHEN ? THEN ?").join(" ");
	const placeholders = ids.map(() => "?").join(",");
	const values = ids.flatMap((id, index) => [id, index]);
	await connection.prepare(`UPDATE projects SET sort_order = CASE id ${cases} END WHERE id IN (${placeholders})`).run(...values, ...ids);
	return true;
}

/* ---------- Görseller ---------- */

/** Dosya içeriğinin ilk baytlarından gerçek türü bulur (uzantıya ya da tarayıcıya güvenmez). */
function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
	const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
	if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
		return { mime: "image/png", ext: "png" };
	if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
	const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
	if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
		return { mime: "image/webp", ext: "webp" };
	return null;
}

export async function saveProjectImage(
	id: string,
	file: File,
): Promise<{ project: ProjectRecord } | { error: string }> {
	const row = await getRow(id);
	if (!row) return { error: "Proje bulunamadı." };
	if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
		return { error: "Görsel en fazla 3 MB olabilir." };
	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = detectImage(bytes);
	if (!type) return { error: "Yalnızca PNG, JPG veya WebP görsel yüklenebilir." };
	const stored = `${randomUUID()}.${type.ext}`;
	await storeFile(imageKey(stored), bytes, type.mime);
	try {
		await db()
			.prepare(
				"UPDATE projects SET image_file=?, image_mime=?, updated_at=? WHERE id=?",
			)
			.run(stored, type.mime, new Date().toISOString(), id);
	} catch (error) {
		await deleteFile(imageKey(stored)).catch(() => {});
		throw error;
	}
	if (row.image_file) await deleteFile(imageKey(row.image_file)).catch(() => {});
	return { project: (await getProject(id)) as ProjectRecord };
}

export async function removeProjectImage(id: string) {
	const row = await getRow(id);
	if (!row) return null;
	await db()
		.prepare(
			"UPDATE projects SET image_file=NULL, image_mime=NULL, updated_at=? WHERE id=?",
		)
		.run(new Date().toISOString(), id);
	if (row.image_file)
		await deleteFile(imageKey(row.image_file)).catch(() => {});
	return getProject(id);
}

export async function readProjectImage(id: string) {
	const row = await getRow(id);
	if (!row?.image_file || !row.image_mime) return null;
	try {
		const bytes = await loadFile(imageKey(row.image_file));
		return { bytes, mime: row.image_mime, published: Boolean(row.published) };
	} catch {
		return null;
	}
}
