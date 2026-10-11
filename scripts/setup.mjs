import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const target = new URL("../.env.local", import.meta.url);
const existing = existsSync(target) ? readFileSync(target, "utf8") : "";
const currentUsername = existing.match(/^ANUBIX_ADMIN_USERNAME=(.+)$/m)?.[1]?.trim() || "";

if (!stdin.isTTY) {
  console.error("Parolayı gizli almak için etkileşimli bir terminal kullan.");
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });
const answer = await rl.question(
  currentUsername
    ? `Yönetici kullanıcı adı (Enter: ${currentUsername}): `
    : "Yönetici kullanıcı adı: ",
);
rl.close();
const username = answer.trim() || currentUsername;

function secret(prompt) {
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const key of chunk.toString("utf8")) {
        if (key === "\r" || key === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (key === "\u0003") {
          cleanup();
          reject(new Error("İşlem iptal edildi."));
          return;
        }
        if (key === "\u007f" || key === "\b") value = value.slice(0, -1);
        else value += key;
      }
    };
    stdin.on("data", onData);
  });
}

const password = await secret("Yeni yönetici parolası (en az 12 karakter): ");
const confirmation = await secret("Parolayı tekrar yaz: ");
if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username) || password.length < 12 || password.length > 256) {
  console.error("Kullanıcı adı 3-40 güvenli karakter; parola 12-256 karakter olmalı.");
  process.exit(1);
}
if (password !== confirmation) {
  console.error("Parolalar eşleşmiyor; ayarlar değiştirilmedi.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64).toString("hex");
const withoutAdmin = existing
  .replace(/^ANUBIX_ADMIN_(?:USERNAME|PASSWORD_HASH)=.*(?:\r?\n|$)/gm, "")
  .trimEnd();
const defaults = existing
  ? ""
  : "ANUBIX_HTTPS=false\n# OLLAMA_BASE_URL=http://127.0.0.1:11434\n# OLLAMA_MODEL=\n# RESEND_API_KEY=\n# ANUBIX_MAIL_FROM=Anubix <hatirlatma@bildirim.anubix.dev>\n# ANUBIX_MAIL_TO=\n# ANUBIX_MAIL_TIME_ZONE=Europe/Istanbul\n# ANUBIX_MAIL_HOUR=9\n";
const updated = `${withoutAdmin ? `${withoutAdmin}\n` : ""}${defaults}ANUBIX_ADMIN_USERNAME=${username}\nANUBIX_ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${hash}\n`;
const temporary = new URL(`../.env.local.${randomBytes(6).toString("hex")}.tmp`, import.meta.url);
writeFileSync(temporary, updated, { mode: 0o600, flag: "wx" });
renameSync(temporary, target);

const generatedCredentials = new URL("../.anubix-data/admin-credentials-2026-10-11.txt", import.meta.url);
if (existsSync(generatedCredentials)) unlinkSync(generatedCredentials);
console.log("Yönetici girişi güncellendi. Yeni parolan yalnızca hash olarak saklandı. Uygulamayı yeniden başlat.");
