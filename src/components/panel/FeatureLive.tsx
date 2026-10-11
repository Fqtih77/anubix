"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PanelFeatureId } from "@/data/panelFeatures";
import { api } from "./api";
import styles from "./FeatureLive.module.css";
import { ProjectsManager } from "./ProjectsManager";

type Kind = "notes" | "quests" | "calendar";
type Entry = {
	id: string;
	title: string;
	body: string;
	dateValue: string | null;
	done: boolean;
};
type SavedFile = { id: string; name: string; size: number };
type Message = { id: string; role: "user" | "assistant"; content: string };
const localDate = (date: Date) => date.toLocaleDateString("sv-SE");

export function FeatureLive({ id }: { id: PanelFeatureId }) {
	if (id === "storage") return <Storage />;
	if (id === "assistant") return <Assistant />;
	if (id === "projects") return <ProjectsManager />;
	return <Entries key={id} kind={id} />;
}

function Entries({ kind }: { kind: Kind }) {
	const [items, setItems] = useState<Entry[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [editing, setEditing] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [dateValue, setDateValue] = useState("");
	const [month, setMonth] = useState(() => localDate(new Date()).slice(0, 7));
	const reload = useCallback(async () => {
		try {
			setItems((await api<{ items: Entry[] }>(`/api/panel/${kind}`)).items);
			setError("");
		} catch (e) {
			setError((e as Error).message);
		}
	}, [kind]);
	useEffect(() => {
		void reload();
	}, [reload]);
	const reset = () => {
		setEditing(null);
		setTitle("");
		setBody("");
		setDateValue("");
	};
	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		setBusy(true);
		try {
			await api(`/api/panel/${kind}${editing ? `/${editing}` : ""}`, {
				method: editing ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					body,
					dateValue: dateValue || null,
					done: items.find((x) => x.id === editing)?.done || false,
				}),
			});
			reset();
			await reload();
			if (kind === "quests") window.dispatchEvent(new Event("anubix:quests-changed"));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	const remove = async (id: string) => {
		if (!window.confirm("Bu kayıt silinsin mi?")) return;
		setBusy(true);
		try {
			await api(`/api/panel/${kind}/${id}`, { method: "DELETE" });
			await reload();
			if (kind === "quests") window.dispatchEvent(new Event("anubix:quests-changed"));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	const toggle = async (item: Entry) => {
		setBusy(true);
		try {
			await api(`/api/panel/quests/${item.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: item.title,
					body: item.body,
					dateValue: item.dateValue,
					done: !item.done,
				}),
			});
			await reload();
			window.dispatchEvent(new Event("anubix:quests-changed"));
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className={styles.stack}>
			{kind === "calendar" ? (
				<CalendarGrid
					month={month}
					setMonth={setMonth}
					items={items}
					setDateValue={setDateValue}
				/>
			) : null}
			<form className={styles.editor} onSubmit={save}>
				<h3>
					{editing
						? "Kaydı düzenle"
						: kind === "notes"
							? "Yeni not"
							: kind === "quests"
								? "Yeni görev / anımsatıcı"
								: "Yeni etkinlik"}
				</h3>
				<label>
					Başlık
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={120}
						required
					/>
				</label>
				<label>
					Açıklama
					<textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						maxLength={20_000}
						rows={kind === "notes" ? 5 : 2}
					/>
				</label>
				{kind !== "notes" ? (
					<label>
						{kind === "quests" ? "Bitiş tarihi" : "Etkinlik tarihi"}
						<input
							type="date"
							value={dateValue}
							onChange={(e) => setDateValue(e.target.value)}
							required={kind === "calendar"}
						/>
					</label>
				) : null}
				<div className={styles.actions}>
					<button type="submit" disabled={busy}>
						{editing ? "Kaydet" : "Ekle"}
					</button>
					{editing ? (
						<button type="button" onClick={reset}>
							Vazgeç
						</button>
					) : null}
				</div>
			</form>
			{error ? (
				<p className={styles.error} role="alert">
					{error}
				</p>
			) : null}
			{items.length === 0 ? (
				<p className={styles.empty}>Henüz kayıt yok.</p>
			) : (
				<ul className={styles.list}>
					{items.map((item) => (
						<li key={item.id} className={styles.entry}>
							<div className={styles.entryHead}>
								{kind === "quests" ? (
									<input
										type="checkbox"
										aria-label={`${item.title} tamamlandı`}
										checked={item.done}
										disabled={busy}
										onChange={() => void toggle(item)}
									/>
								) : null}
								<strong data-done={item.done}>{item.title}</strong>
								{item.dateValue ? (
									<time dateTime={item.dateValue}>{item.dateValue}</time>
								) : null}
							</div>
							{item.body ? <p>{item.body}</p> : null}
							{kind === "quests" &&
							item.dateValue &&
							!item.done &&
							item.dateValue < localDate(new Date()) ? (
								<span className={styles.overdue}>Gecikti</span>
							) : null}
							<div className={styles.actions}>
								<button
									type="button"
									onClick={() => {
										setEditing(item.id);
										setTitle(item.title);
										setBody(item.body);
										setDateValue(item.dateValue || "");
									}}
								>
									Düzenle
								</button>
								<button
									type="button"
									disabled={busy}
									onClick={() => void remove(item.id)}
								>
									Sil
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function CalendarGrid({
	month,
	setMonth,
	items,
	setDateValue,
}: {
	month: string;
	setMonth: (s: string) => void;
	items: Entry[];
	setDateValue: (s: string) => void;
}) {
	const [year, m] = month.split("-").map(Number);
	const first = new Date(year, m - 1, 1);
	const lead = (first.getDay() + 6) % 7;
	const days = new Date(year, m, 0).getDate();
	const shift = (offset: number) =>
		setMonth(localDate(new Date(year, m - 1 + offset, 1)).slice(0, 7));
	return (
		<div className={styles.stack}>
			<div className={styles.monthNav}>
				<button type="button" onClick={() => shift(-1)} aria-label="Önceki ay">
					‹
				</button>
				<h3>
					{first.toLocaleDateString("tr-TR", {
						month: "long",
						year: "numeric",
					})}
				</h3>
				<button type="button" onClick={() => shift(1)} aria-label="Sonraki ay">
					›
				</button>
			</div>
			<div className={styles.calendar}>
				{["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((day) => (
					<span key={day}>{day}</span>
				))}
				{["pad-a", "pad-b", "pad-c", "pad-d", "pad-e", "pad-f"]
					.slice(0, lead)
					.map((key) => (
						<span key={key} />
					))}
				{Array.from({ length: days }, (_, i) => {
					const date = `${month}-${String(i + 1).padStart(2, "0")}`;
					const count = items.filter((x) => x.dateValue === date).length;
					return (
						<button
							type="button"
							key={date}
							onClick={() => setDateValue(date)}
							aria-label={`${date}: ${count} etkinlik`}
						>
							{i + 1}
							{count ? <small>•{count}</small> : null}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function Storage() {
	const [files, setFiles] = useState<SavedFile[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const input = useRef<HTMLInputElement>(null);
	const reload = useCallback(async () => {
		try {
			setFiles((await api<{ files: SavedFile[] }>("/api/files")).files);
			setError("");
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);
	useEffect(() => {
		void reload();
	}, [reload]);
	const upload = async (event: React.FormEvent) => {
		event.preventDefault();
		const file = input.current?.files?.[0];
		if (!file) return;
		setBusy(true);
		try {
			const form = new FormData();
			form.append("file", file);
			await api("/api/files", { method: "POST", body: form });
			if (input.current) input.current.value = "";
			await reload();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	const remove = async (id: string) => {
		if (!window.confirm("Dosya kalıcı olarak silinsin mi?")) return;
		setBusy(true);
		try {
			await api(`/api/files/${id}`, { method: "DELETE" });
			await reload();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className={styles.stack}>
			<p className={styles.notice}>
				Dosya başına 10 MB, toplam 100 MB. Dosyalar yalnızca giriş yapmış
				kullanıcıya açılır.
			</p>
			<form className={styles.upload} onSubmit={upload}>
				<input ref={input} type="file" aria-label="Yüklenecek dosya" required />
				<button type="submit" disabled={busy}>
					{busy ? "Yükleniyor…" : "Sandığa koy"}
				</button>
			</form>
			{error ? (
				<p className={styles.error} role="alert">
					{error}
				</p>
			) : null}
			{files.length === 0 ? (
				<p className={styles.empty}>Sandık boş.</p>
			) : (
				<ul className={styles.list}>
					{files.map((file) => (
						<li className={styles.entry} key={file.id}>
							<strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB
							<div className={styles.actions}>
								<a href={`/api/files/${file.id}`}>İndir</a>
								<button
									type="button"
									disabled={busy}
									onClick={() => void remove(file.id)}
								>
									Sil
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function Assistant() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [available, setAvailable] = useState(false);
	const [draft, setDraft] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		void api<{ messages: Message[]; available: boolean }>("/api/chat")
			.then((data) => {
				setMessages(data.messages);
				setAvailable(data.available);
			})
			.catch((e) => setError(e.message));
	}, []);
	const send = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!draft.trim()) return;
		setBusy(true);
		setError("");
		try {
			const data = await api<{ user: Message; assistant: Message }>(
				"/api/chat",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ content: draft }),
				},
			);
			setMessages((old) => [...old, data.user, data.assistant]);
			setDraft("");
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};
	const clear = async () => {
		if (!window.confirm("Sohbet geçmişi silinsin mi?")) return;
		try {
			await api("/api/chat", { method: "DELETE" });
			setMessages([]);
		} catch (e) {
			setError((e as Error).message);
		}
	};
	return (
		<div className={styles.stack}>
			<p className={styles.notice}>
				{available
					? "Bix için yerel model ayarlı. Notlarına ve dosyalarına otomatik erişimi yok."
					: "Bix için Ollama modeli ayarlanmadı. Kurulum adımları README'de."}
			</p>
			<div className={styles.chatLog} aria-live="polite">
				{messages.length ? (
					messages.map((m) => (
						<div key={m.id} className={styles.message}>
							<strong>{m.role === "user" ? "Sen" : "Bix"}</strong>
							<p>{m.content}</p>
						</div>
					))
				) : (
					<p className={styles.empty}>Henüz mesaj yok.</p>
				)}
			</div>
			{error ? (
				<p className={styles.error} role="alert">
					{error}
				</p>
			) : null}
			<form className={styles.inputRow} onSubmit={send}>
				<label htmlFor="bix-input">Mesaj</label>
				<input
					id="bix-input"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					maxLength={4000}
					disabled={!available || busy}
					placeholder="Bix'e bir şey sor…"
				/>
				<button type="submit" disabled={!available || busy}>
					Gönder
				</button>
			</form>
			{messages.length ? (
				<button type="button" onClick={() => void clear()}>
					Geçmişi sil
				</button>
			) : null}
		</div>
	);
}
