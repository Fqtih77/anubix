import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const target = new URL("../.env.local", import.meta.url);
const existing = existsSync(target) ? readFileSync(target, "utf8") : "";
if (/^ANUBIX_ADMIN_(?:USERNAME|PASSWORD_HASH)=/m.test(existing)) {
  console.error("Yönetici hesabı zaten ayarlı. Mevcut ayarlar korunuyor.");
  process.exit(1);
}
const rl = createInterface({ input: stdin, output: stdout });
const username = (await rl.question("Yönetici kullanıcı adı: ")).trim();
rl.close();
if (!stdin.isTTY) {
  console.error("Parolayı gizli almak için etkileşimli bir terminal kullan.");
  process.exit(1);
}
stdout.write("Yönetici parolası (en az 12 karakter): ");
stdin.setRawMode(true);
stdin.resume();
let password = "";
let complete = false;
for await (const chunk of stdin) {
  for (const key of chunk.toString()) {
    if (key === "\r" || key === "\n") { complete = true; break; }
    if (key === "\u0003") { stdin.setRawMode(false); process.exit(130); }
    if (key === "\u007f") password = password.slice(0, -1);
    else password += key;
  }
  if (complete) break;
}
stdin.setRawMode(false);
stdout.write("\n");
if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username) || password.length < 12 || password.length > 256) {
  console.error("Kullanıcı adı 3-40 güvenli karakter; parola 12-256 karakter olmalı.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64).toString("hex");
const adminSettings = `ANUBIX_ADMIN_USERNAME=${username}\nANUBIX_ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${hash}\n`;
if (existsSync(target)) {
  appendFileSync(target, `${existing.endsWith("\n") ? "" : "\n"}${adminSettings}`, { mode: 0o600 });
} else {
  writeFileSync(target, `${adminSettings}ANUBIX_HTTPS=false\n# OLLAMA_BASE_URL=http://127.0.0.1:11434\n# OLLAMA_MODEL=\n# RESEND_API_KEY=\n# ANUBIX_MAIL_FROM=Anubix <hatirlatma@bildirim.anubix.dev>\n# ANUBIX_MAIL_TO=\n# ANUBIX_MAIL_TIME_ZONE=Europe/Istanbul\n# ANUBIX_MAIL_HOUR=9\n`, { mode: 0o600, flag: "wx" });
}
console.log("Yönetici hesabı .env.local dosyasına eklendi. Parola yalnızca hash olarak kaydedildi.");
