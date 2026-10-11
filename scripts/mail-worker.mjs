import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HALF_HOUR = 30 * 60_000;

function localParts(now, timeZone) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

export function mailConfig(env = process.env) {
  return {
    apiKey: env.RESEND_API_KEY?.trim(),
    from: env.ANUBIX_MAIL_FROM?.trim(),
    to: env.ANUBIX_MAIL_TO?.trim(),
    timeZone: env.ANUBIX_MAIL_TIME_ZONE?.trim() || "Europe/Istanbul",
    hour: Number(env.ANUBIX_MAIL_HOUR ?? 9),
  };
}

export function openMailDatabase(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const connection = new DatabaseSync(path.join(directory, "anubix.sqlite"));
  connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS mail_digests (
      date TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );
  `);
  return connection;
}

export async function sendResendEmail({ apiKey, from, to, date, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `anubix-digest-${date}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Anubix · ${date} hatırlatmaları`,
      text,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
  const result = await response.json();
  if (typeof result.id !== "string" || !result.id)
    throw new Error("Resend yanıtında e-posta kimliği yok.");
  return result.id;
}

/** Günde tek özet gönderir. Başarısız gönderim aynı gün tekrar denenir. */
export async function runDigest({ connection, now = new Date(), config, sendEmail = sendResendEmail }) {
  if (!config.apiKey || !config.from || !config.to) return { status: "unconfigured" };
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(config.to))
    throw new Error("ANUBIX_MAIL_TO tek bir geçerli e-posta adresi olmalı.");
  if (!Number.isInteger(config.hour) || config.hour < 0 || config.hour > 23)
    throw new Error("ANUBIX_MAIL_HOUR 0-23 arasında olmalı.");
  const { date, hour } = localParts(now, config.timeZone);
  if (hour < config.hour) return { status: "early", date };
  const alreadySent = connection.prepare("SELECT date FROM mail_digests WHERE date = ?").get(date);
  if (alreadySent) return { status: "sent", date };
  const entriesExist = connection
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'")
    .get();
  if (!entriesExist) return { status: "waiting", date };

  const tasks = connection.prepare(
    "SELECT title,date_value AS due FROM entries WHERE kind='quests' AND done=0 AND date_value IS NOT NULL AND substr(date_value,1,10) <= ? ORDER BY date_value ASC,title ASC",
  ).all(date);
  const events = connection.prepare(
    "SELECT title,date_value AS due FROM entries WHERE kind='calendar' AND substr(date_value,1,10) = ? ORDER BY date_value ASC,title ASC",
  ).all(date);
  if (!tasks.length && !events.length) return { status: "empty", date };

  const text = [
    `Anubix · ${date}`,
    "",
    ...(tasks.length ? ["Tamamlanmamış görevler:", ...tasks.map((item) => `- ${item.title} (${item.due})`), ""] : []),
    ...(events.length ? ["Bugünkü etkinlikler:", ...events.map((item) => `- ${item.title} (${item.due})`), ""] : []),
    "Bu e-posta yalnızca Anubix kişisel panelindeki tarihli kayıtlardan oluşturuldu.",
  ].join("\n");
  const providerId = await sendEmail({ ...config, date, text });
  connection.prepare("INSERT INTO mail_digests (date,provider_id,sent_at) VALUES (?,?,?)")
    .run(date, providerId, now.toISOString());
  return { status: "delivered", date, tasks: tasks.length, events: events.length };
}

async function main() {
  const envFile = path.join(process.cwd(), ".env.local");
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const config = mailConfig();
  const directory = process.env.ANUBIX_DATA_DIR || path.join(process.cwd(), ".anubix-data");
  const connection = openMailDatabase(directory);
  const once = process.argv.includes("--once");
  if (!config.apiKey || !config.from || !config.to)
    console.log("E-posta ayarlanmadı; RESEND_API_KEY, ANUBIX_MAIL_FROM ve ANUBIX_MAIL_TO gerekli.");
  const check = async () => {
    try {
      const result = await runDigest({ connection, config });
      if (result.status === "delivered")
        console.log(`${result.date}: ${result.tasks} görev ve ${result.events} etkinlik için özet gönderildi.`);
      if (once) console.log(JSON.stringify(result));
    } catch (error) {
      console.error("E-posta hatırlatıcısı:", error);
      if (once) process.exitCode = 1;
    }
    if (!once) setTimeout(check, HALF_HOUR);
    else connection.close();
  };
  await check();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  await main();
