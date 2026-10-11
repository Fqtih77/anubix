import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { openMailDatabase, runDigest, sendResendEmail } from "./mail-worker.mjs";

const config = {
  apiKey: "test-key",
  from: "Anubix <test@bildirim.anubix.dev>",
  to: "owner@anubix.dev",
  timeZone: "Europe/Istanbul",
  hour: 9,
};

test("yalnızca kişisel görev ve bugünkü etkinlikler bir kez özetlenir", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "anubix-mail-"));
  const connection = openMailDatabase(directory);
  try {
    connection.exec("CREATE TABLE entries (kind TEXT,title TEXT,date_value TEXT,done INTEGER)");
    const insert = connection.prepare("INSERT INTO entries VALUES (?,?,?,?)");
    insert.run("quests", "Geciken görev", "2026-10-10", 0);
    insert.run("quests", "Bugünkü görev", "2026-10-11", 0);
    insert.run("quests", "Bitmiş görev", "2026-10-11", 1);
    insert.run("quests", "Gelecek görev", "2026-10-12", 0);
    insert.run("calendar", "Bugünkü görüşme", "2026-10-11", 0);
    insert.run("calendar", "Dünkü görüşme", "2026-10-10", 0);
    let sends = 0;
    let content = "";
    const sendEmail = async (mail) => {
      sends++;
      content = mail.text;
      assert.equal(mail.to, config.to);
      return "email-1";
    };
    const before = await runDigest({ connection, config, now: new Date("2026-10-11T05:30:00Z"), sendEmail });
    assert.equal(before.status, "early");
    const sent = await runDigest({ connection, config, now: new Date("2026-10-11T06:00:00Z"), sendEmail });
    assert.deepEqual(sent, { status: "delivered", date: "2026-10-11", tasks: 2, events: 1 });
    assert.match(content, /Geciken görev/);
    assert.match(content, /Bugünkü görev/);
    assert.match(content, /Bugünkü görüşme/);
    assert.doesNotMatch(content, /Bitmiş görev|Gelecek görev|Dünkü görüşme/);
    const repeat = await runDigest({ connection, config, now: new Date("2026-10-11T09:00:00Z"), sendEmail });
    assert.equal(repeat.status, "sent");
    assert.equal(sends, 1);
  } finally {
    connection.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("gönderim başarısızsa aynı gün yeniden denenebilir", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "anubix-mail-"));
  const connection = openMailDatabase(directory);
  try {
    connection.exec("CREATE TABLE entries (kind TEXT,title TEXT,date_value TEXT,done INTEGER)");
    connection.prepare("INSERT INTO entries VALUES (?,?,?,?)").run("quests", "Hatırlat", "2026-10-11", 0);
    const now = new Date("2026-10-11T06:00:00Z");
    await assert.rejects(runDigest({ connection, config, now, sendEmail: async () => { throw new Error("network"); } }));
    const retried = await runDigest({ connection, config, now, sendEmail: async () => "email-2" });
    assert.equal(retried.status, "delivered");
  } finally {
    connection.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Resend isteği yalnızca belirlenen alıcıya ve sabit tekrar anahtarıyla gider", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      assert.equal(options.headers["Idempotency-Key"], "anubix-digest-2026-10-11");
      assert.equal(options.headers.Authorization, "Bearer test-key");
      const body = JSON.parse(options.body);
      assert.deepEqual(body.to, ["owner@anubix.dev"]);
      assert.equal(body.text, "Hatırlatma");
      return new Response(JSON.stringify({ id: "email-3" }), { status: 200 });
    };
    const id = await sendResendEmail({ ...config, date: "2026-10-11", text: "Hatırlatma" });
    assert.equal(id, "email-3");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
