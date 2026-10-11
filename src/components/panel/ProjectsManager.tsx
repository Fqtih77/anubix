"use client";

import Image from "next/image";
import {
	type CSSProperties,
	type FormEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { ProjectFolderIcon } from "@/components/screens/ProjectsDesktop";
import {
	type Project,
	type ProjectStatus,
	projectInitial,
	STATUS_LABEL,
} from "@/data/projects";
import { api } from "./api";
import live from "./FeatureLive.module.css";
import styles from "./ProjectsManager.module.css";

/**
 * KOMUT BLOĞU · PROJE YÖNETİCİSİ
 * ------------------------------
 * Odadaki proje masaüstünde klasör olarak görünen projeler buradan eklenir, düzenlenir,
 * sıralanır, gizlenir ve silinir. Veriler `/api/projects` üzerinden SQLite'a yazılır;
 * görseller veri klasöründe saklanır. Kod değiştirmek gerekmez.
 */

/** Paneldeki proje kaydı (sunucudaki ProjectRecord'un istemci tarafı karşılığı) */
type Managed = Project & {
	published: boolean;
	hasImage: boolean;
	imageAlt: string;
	updatedAt: string;
};

interface Draft {
	title: string;
	tagline: string;
	status: ProjectStatus;
	period: string;
	summary: string;
	description: string;
	/** Her satır bir madde */
	done: string;
	planned: string;
	/** Virgülle ayrılmış */
	tech: string;
	github: string;
	live: string;
	liveNote: string;
	accent: string;
	accent2: string;
	imageAlt: string;
	published: boolean;
}

/** Yeni projelere sırayla önerilen renk çiftleri */
const PALETTE: [string, string][] = [
	["#8b7cf6", "#6fd3b1"],
	["#ef8a5b", "#ffd3a8"],
	["#3fb68b", "#c9f2df"],
	["#2f7de1", "#a9d1ff"],
	["#e2668f", "#ffc9da"],
	["#e8b84f", "#fff0b8"],
];

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const JSON_HEADERS = { "Content-Type": "application/json" };

function emptyDraft(count: number): Draft {
	const [accent, accent2] = PALETTE[count % PALETTE.length];
	return {
		title: "",
		tagline: "",
		status: "in-progress",
		period: "",
		summary: "",
		description: "",
		done: "",
		planned: "",
		tech: "",
		github: "",
		live: "",
		liveNote: "",
		accent,
		accent2,
		imageAlt: "",
		published: true,
	};
}

function toDraft(p: Managed): Draft {
	return {
		title: p.title,
		tagline: p.tagline,
		status: p.status,
		period: p.period ?? "",
		summary: p.summary,
		description: p.description,
		done: p.done.join("\n"),
		planned: p.planned.join("\n"),
		tech: p.tech.join(", "),
		github: p.links.github ?? "",
		live: p.links.live ?? "",
		liveNote: p.liveNote ?? "",
		accent: p.accent,
		accent2: p.accent2,
		imageAlt: p.imageAlt,
		published: p.published,
	};
}

const lines = (text: string) =>
	text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

/** "github.com/…" gibi şemasız adreslerin başına https:// ekler. */
function withScheme(value: string) {
	const v = value.trim();
	return v && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? `https://${v}` : v;
}

function toPayload(d: Draft) {
	return {
		...d,
		done: lines(d.done),
		planned: lines(d.planned),
		tech: d.tech
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean),
		github: withScheme(d.github),
		live: withScheme(d.live),
	};
}

export function ProjectsManager() {
	const [projects, setProjects] = useState<Managed[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [status, setStatus] = useState("");
	/** null: liste, "new": yeni proje formu, diğer: düzenlenen projenin kimliği */
	const [editing, setEditing] = useState<string | null>(null);
	const [formKey, setFormKey] = useState(0);
	const newButton = useRef<HTMLButtonElement>(null);

	const reload = useCallback(async () => {
		try {
			setProjects(
				(await api<{ projects: Managed[] }>("/api/projects?all=1")).projects,
			);
			setError("");
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoaded(true);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const openForm = (id: string) => {
		setStatus("");
		setEditing(id);
		setFormKey((k) => k + 1);
	};

	const closeForm = (message = "") => {
		setEditing(null);
		setStatus(message);
		requestAnimationFrame(() => newButton.current?.focus());
	};

	const move = async (index: number, delta: number) => {
		const target = index + delta;
		if (target < 0 || target >= projects.length) return;
		const order = projects.map((p) => p.id);
		[order[index], order[target]] = [order[target], order[index]];
		setBusy(true);
		try {
			const data = await api<{ projects: Managed[] }>("/api/projects", {
				method: "PATCH",
				headers: JSON_HEADERS,
				body: JSON.stringify({ order }),
			});
			setProjects(data.projects);
			setStatus(
				"Sıralama kaydedildi. Masaüstündeki klasörler bu sırayla dizilir.",
			);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const remove = async (p: Managed) => {
		if (
			!window.confirm(
				`"${p.title}" projesi ve görseli kalıcı olarak silinsin mi?`,
			)
		)
			return;
		setBusy(true);
		try {
			await api(`/api/projects/${p.id}`, { method: "DELETE" });
			await reload();
			setStatus(`"${p.title}" silindi.`);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	if (editing !== null) {
		return (
			<ProjectForm
				key={formKey}
				project={
					editing === "new"
						? null
						: (projects.find((p) => p.id === editing) ?? null)
				}
				count={projects.length}
				onCancel={() => closeForm()}
				onCreated={(id) => {
					setEditing(id);
					void reload();
				}}
				onChanged={reload}
				onDone={(message) => {
					closeForm(message);
					void reload();
				}}
			/>
		);
	}

	return (
		<div className={live.stack}>
			<p className={live.notice}>
				Buradaki projeler odadaki <strong>Projeler</strong> plağıyla açılan
				masaüstünde klasör olarak görünür. Değişiklikler odada sayfa yenilenince
				görünür.
			</p>
			<div className={styles.toolbar}>
				<button
					ref={newButton}
					type="button"
					onClick={() => openForm("new")}
					disabled={busy}
				>
					+ Yeni proje
				</button>
				<span className={styles.count}>
					{loaded ? `${projects.length} proje` : ""}
				</span>
			</div>
			{status ? (
				<p className={styles.status} role="status">
					{status}
				</p>
			) : null}
			{error ? (
				<p className={live.error} role="alert">
					{error}
				</p>
			) : null}
			{!loaded ? (
				<p className={live.empty}>Yükleniyor…</p>
			) : projects.length === 0 ? (
				<p className={live.empty}>Henüz proje yok. İlk projeni ekle.</p>
			) : (
				<ol className={live.list}>
					{projects.map((p, i) => (
						<li key={p.id} className={`${live.entry} ${styles.row}`}>
							<span
								className={styles.chip}
								style={{ "--a": p.accent } as CSSProperties}
								aria-hidden="true"
							>
								{projectInitial(p)}
							</span>
							<div className={styles.rowText}>
								<strong>{p.title}</strong>
								<span className={styles.meta}>
									{STATUS_LABEL[p.status]}
									{p.published ? null : (
										<span className={styles.badge} data-tone="hidden">
											Gizli
										</span>
									)}
									{p.hasImage ? (
										<span className={styles.badge}>Görsel var</span>
									) : null}
								</span>
							</div>
							<div className={styles.rowActions}>
								<button
									type="button"
									aria-label={`${p.title}: yukarı taşı`}
									disabled={busy || i === 0}
									onClick={() => void move(i, -1)}
								>
									↑
								</button>
								<button
									type="button"
									aria-label={`${p.title}: aşağı taşı`}
									disabled={busy || i === projects.length - 1}
									onClick={() => void move(i, 1)}
								>
									↓
								</button>
								<button
									type="button"
									disabled={busy}
									onClick={() => openForm(p.id)}
								>
									Düzenle
								</button>
								<button
									type="button"
									disabled={busy}
									onClick={() => void remove(p)}
								>
									Sil
								</button>
							</div>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}

/* ---------- Ekleme / düzenleme formu ---------- */

interface FormProps {
	project: Managed | null;
	count: number;
	onCancel: () => void;
	/** Yeni proje kaydedildi ama form açık kalmalı (ör. görsel yüklenemedi) */
	onCreated: (id: string) => void;
	/** Liste yeniden yüklensin, form açık kalsın */
	onChanged: () => Promise<void>;
	/** Kaydedildi, listeye dön */
	onDone: (message: string) => void;
}

function ProjectForm({
	project,
	count,
	onCancel,
	onCreated,
	onChanged,
	onDone,
}: FormProps) {
	const [initial] = useState<Draft>(() =>
		project ? toDraft(project) : emptyDraft(count),
	);
	const [draft, setDraft] = useState<Draft>(initial);
	const [savedId, setSavedId] = useState<string | null>(project?.id ?? null);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const fileInput = useRef<HTMLInputElement>(null);
	const firstField = useRef<HTMLInputElement>(null);
	const uid = useId();

	useEffect(() => {
		firstField.current?.focus();
	}, []);

	// Seçilen görselin yerel önizlemesi
	useEffect(() => {
		if (!file) {
			setPreview(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const field = <K extends keyof Draft>(key: K) => ({
		value: draft[key] as string,
		onChange: (event: { target: { value: string } }) =>
			setDraft((d) => ({ ...d, [key]: event.target.value })),
	});

	const clearFile = () => {
		setFile(null);
		if (fileInput.current) fileInput.current.value = "";
	};

	const pickFile = (picked: File | null) => {
		setError("");
		if (picked && !IMAGE_TYPES.includes(picked.type)) {
			setError("Yalnızca PNG, JPG veya WebP görsel yüklenebilir.");
			clearFile();
			return;
		}
		if (picked && picked.size > MAX_IMAGE_BYTES) {
			setError("Görsel en fazla 3 MB olabilir.");
			clearFile();
			return;
		}
		setFile(picked);
	};

	const cancel = () => {
		const dirty =
			file !== null || JSON.stringify(draft) !== JSON.stringify(initial);
		if (dirty && !window.confirm("Kaydedilmemiş değişiklikler silinsin mi?"))
			return;
		onCancel();
	};

	const save = async (event: FormEvent) => {
		event.preventDefault();
		setBusy(true);
		setError("");
		try {
			const created = savedId === null;
			const { project: saved } = await api<{ project: Managed }>(
				created ? "/api/projects" : `/api/projects/${savedId}`,
				{
					method: created ? "POST" : "PUT",
					headers: JSON_HEADERS,
					body: JSON.stringify(toPayload(draft)),
				},
			);
			setSavedId(saved.id);
			if (file) {
				const form = new FormData();
				form.append("image", file);
				try {
					await api(`/api/projects/${saved.id}/image`, {
						method: "POST",
						body: form,
					});
				} catch (e) {
					setError(
						`Proje kaydedildi ama görsel yüklenemedi: ${(e as Error).message}`,
					);
					if (created) onCreated(saved.id);
					else await onChanged();
					return;
				}
			}
			const hidden = saved.published
				? ""
				: " Gizli olduğu için odada görünmez.";
			onDone(
				`"${saved.title}" ${created ? "eklendi" : "güncellendi"}.${hidden}`,
			);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const removeImage = async () => {
		if (!savedId || !window.confirm("Kapak görseli kaldırılsın mı?")) return;
		setBusy(true);
		setError("");
		try {
			await api(`/api/projects/${savedId}/image`, { method: "DELETE" });
			await onChanged();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const imageSrc = preview ?? project?.image?.src ?? null;
	const ids = {
		heading: `${uid}-heading`,
		lines: `${uid}-lines`,
		tech: `${uid}-tech`,
		image: `${uid}-image`,
	};

	return (
		<div className={live.stack}>
			<form
				className={`${live.editor} ${styles.form}`}
				onSubmit={save}
				aria-labelledby={ids.heading}
			>
				<div className={styles.formHead}>
					<h3 id={ids.heading}>
						{savedId
							? `${project?.title ?? draft.title} düzenleniyor`
							: "Yeni proje"}
					</h3>
					<button type="button" onClick={cancel}>
						← Listeye dön
					</button>
				</div>

				<div
					className={styles.preview}
					style={{ "--a": draft.accent, "--b": draft.accent2 } as CSSProperties}
					aria-hidden="true"
				>
					<ProjectFolderIcon
						letter={projectInitial({ title: draft.title || "?" })}
						color={draft.accent}
					/>
					<span>{draft.title || "Proje adı"}</span>
					<small>Masaüstünde böyle görünecek</small>
				</div>

				<fieldset>
					<legend>Temel bilgiler</legend>
					<label>
						Proje adı *
						<input
							ref={firstField}
							{...field("title")}
							maxLength={80}
							required
						/>
					</label>
					<label>
						Kısa açıklama
						<input
							{...field("tagline")}
							maxLength={120}
							placeholder="Tek cümlelik tanım"
						/>
					</label>
					<div className={styles.two}>
						<label>
							Durum
							<select
								value={draft.status}
								onChange={(e) =>
									setDraft((d) => ({
										...d,
										status: e.target.value as ProjectStatus,
									}))
								}
							>
								<option value="in-progress">
									{STATUS_LABEL["in-progress"]}
								</option>
								<option value="completed">{STATUS_LABEL.completed}</option>
							</select>
						</label>
						<label>
							Dönem
							<input
								{...field("period")}
								maxLength={60}
								placeholder="2026 – Devam ediyor"
							/>
						</label>
					</div>
					<label>
						Özet *
						<textarea {...field("summary")} maxLength={600} rows={3} required />
					</label>
					<label>
						Ayrıntılı açıklama
						<textarea {...field("description")} maxLength={4000} rows={5} />
					</label>
				</fieldset>

				<fieldset>
					<legend>İçerik</legend>
					<p id={ids.lines} className={styles.help}>
						Her satıra bir madde yaz.
					</p>
					<label>
						Şu an var olanlar
						<textarea
							{...field("done")}
							rows={3}
							aria-describedby={ids.lines}
						/>
					</label>
					<label>
						Planlananlar (henüz yok)
						<textarea
							{...field("planned")}
							rows={3}
							aria-describedby={ids.lines}
						/>
					</label>
					<label>
						Teknolojiler
						<input
							{...field("tech")}
							aria-describedby={ids.tech}
							placeholder="Next.js, Docker, Python"
						/>
					</label>
					<p id={ids.tech} className={styles.help}>
						Virgülle ayır; en fazla 20 tane.
					</p>
				</fieldset>

				<fieldset>
					<legend>Bağlantılar</legend>
					<label>
						GitHub bağlantısı
						<input
							{...field("github")}
							inputMode="url"
							spellCheck={false}
							autoComplete="off"
							placeholder="https://github.com/kullanici/proje"
						/>
					</label>
					<label>
						Canlı demo bağlantısı
						<input
							{...field("live")}
							inputMode="url"
							spellCheck={false}
							autoComplete="off"
							placeholder="https://…"
						/>
					</label>
					<label>
						Canlı bağlantı yoksa not
						<input
							{...field("liveNote")}
							maxLength={120}
							placeholder="Henüz yayında değil"
						/>
					</label>
				</fieldset>

				<fieldset>
					<legend>Görünüm</legend>
					<div className={styles.two}>
						<label className={styles.color}>
							Ana renk (klasör)
							<input
								type="color"
								value={draft.accent}
								onChange={(e) =>
									setDraft((d) => ({ ...d, accent: e.target.value }))
								}
							/>
						</label>
						<label className={styles.color}>
							İkinci renk
							<input
								type="color"
								value={draft.accent2}
								onChange={(e) =>
									setDraft((d) => ({ ...d, accent2: e.target.value }))
								}
							/>
						</label>
					</div>
					<div className={styles.image}>
						{imageSrc ? (
							<Image
								className={styles.thumb}
								src={imageSrc}
								alt={draft.imageAlt || "Kapak görseli önizlemesi"}
								width={160}
								height={100}
								unoptimized
							/>
						) : (
							<span className={styles.noImage}>
								Görsel yok: kapakta projenin baş harfi çizilir
							</span>
						)}
						<label>
							Kapak görseli
							<input
								ref={fileInput}
								type="file"
								accept={IMAGE_TYPES.join(",")}
								aria-describedby={ids.image}
								onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
							/>
							<span id={ids.image} className={styles.help}>
								PNG, JPG veya WebP · en fazla 3 MB · kaydedince yüklenir
							</span>
						</label>
						{file || project?.hasImage ? (
							<div className={styles.imageButtons}>
								{file ? (
									<button type="button" onClick={clearFile} disabled={busy}>
										Seçimi kaldır
									</button>
								) : (
									<button
										type="button"
										onClick={() => void removeImage()}
										disabled={busy}
									>
										Görseli kaldır
									</button>
								)}
							</div>
						) : null}
					</div>
					<label>
						Görsel açıklaması
						<input
							{...field("imageAlt")}
							maxLength={160}
							placeholder="Görme engelli ziyaretçiler için kısa tarif"
						/>
					</label>
				</fieldset>

				<label className={styles.check}>
					<input
						type="checkbox"
						checked={draft.published}
						onChange={(e) =>
							setDraft((d) => ({ ...d, published: e.target.checked }))
						}
					/>
					Odadaki masaüstünde göster
				</label>

				{error ? (
					<p className={live.error} role="alert">
						{error}
					</p>
				) : null}

				<div className={live.actions}>
					<button type="submit" disabled={busy}>
						{busy ? "Kaydediliyor…" : savedId ? "Kaydet" : "Projeyi ekle"}
					</button>
					<button type="button" onClick={cancel} disabled={busy}>
						Vazgeç
					</button>
				</div>
			</form>
		</div>
	);
}
