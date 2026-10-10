import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";

export type EntryKind = "notes" | "quests" | "calendar";
export interface Entry {
	id: string;
	kind: EntryKind;
	title: string;
	body: string;
	dateValue: string | null;
	done: boolean;
	createdAt: string;
	updatedAt: string;
}

type Row = {
	id: string;
	kind: EntryKind;
	title: string;
	body: string;
	date_value: string | null;
	done: number;
	created_at: string;
	updated_at: string;
};
const COLUMNS =
	"id, kind, title, body, date_value, done, created_at, updated_at";
const map = (r: Row): Entry => ({
	id: r.id,
	kind: r.kind,
	title: r.title,
	body: r.body,
	dateValue: r.date_value,
	done: Boolean(r.done),
	createdAt: r.created_at,
	updatedAt: r.updated_at,
});

export function kindOf(value: string): EntryKind | null {
	return value === "notes" || value === "quests" || value === "calendar"
		? value
		: null;
}

export function validate(
	input: unknown,
	kind: EntryKind,
): {
	title: string;
	body: string;
	dateValue: string | null;
	done: boolean;
} | null {
	if (!input || typeof input !== "object") return null;
	const v = input as Record<string, unknown>;
	if (typeof v.title !== "string" || !v.title.trim() || v.title.length > 120)
		return null;
	if (
		v.body !== undefined &&
		(typeof v.body !== "string" || v.body.length > 20_000)
	)
		return null;
	if (v.done !== undefined && typeof v.done !== "boolean") return null;
	if (
		v.dateValue !== undefined &&
		v.dateValue !== null &&
		(typeof v.dateValue !== "string" ||
			!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v.dateValue))
	)
		return null;
	const dateValue = typeof v.dateValue === "string" ? v.dateValue : null;
	if (dateValue) {
		const [day, time] = dateValue.split("T");
		const parsed = new Date(`${day}T00:00:00Z`);
		if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day)
			return null;
		if (time) {
			const [hour, minute] = time.split(":").map(Number);
			if (hour > 23 || minute > 59) return null;
		}
	}
	if (kind === "calendar" && !dateValue) return null;
	return {
		title: v.title.trim(),
		body: typeof v.body === "string" ? v.body.trim() : "",
		dateValue,
		done: kind === "quests" && v.done === true,
	};
}

export function list(kind: EntryKind): Entry[] {
	return (
		db()
			.prepare(
				`SELECT ${COLUMNS} FROM entries WHERE kind = ? ORDER BY COALESCE(date_value, created_at) DESC, created_at DESC`,
			)
			.all(kind) as Row[]
	).map(map);
}

export function create(
	kind: EntryKind,
	value: ReturnType<typeof validate>,
): Entry {
	if (!value) throw new Error("Invalid entry");
	const id = randomUUID();
	const now = new Date().toISOString();
	db()
		.prepare(
			"INSERT INTO entries (id,kind,title,body,date_value,done,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
		)
		.run(
			id,
			kind,
			value.title,
			value.body,
			value.dateValue,
			value.done ? 1 : 0,
			now,
			now,
		);
	return { id, kind, ...value, createdAt: now, updatedAt: now };
}

export function update(
	kind: EntryKind,
	id: string,
	value: ReturnType<typeof validate>,
): Entry | null {
	if (!value) throw new Error("Invalid entry");
	const now = new Date().toISOString();
	const result = db()
		.prepare(
			"UPDATE entries SET title=?,body=?,date_value=?,done=?,updated_at=? WHERE id=? AND kind=?",
		)
		.run(
			value.title,
			value.body,
			value.dateValue,
			value.done ? 1 : 0,
			now,
			id,
			kind,
		);
	if (!result.changes) return null;
	return map(
		db()
			.prepare(`SELECT ${COLUMNS} FROM entries WHERE id=? AND kind=?`)
			.get(id, kind) as Row,
	);
}

export function remove(kind: EntryKind, id: string) {
	return Boolean(
		db().prepare("DELETE FROM entries WHERE id=? AND kind=?").run(id, kind)
			.changes,
	);
}
