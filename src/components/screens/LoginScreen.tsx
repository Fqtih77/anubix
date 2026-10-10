"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { seeded } from "@/lib/iso";
import styles from "./LoginScreen.module.css";

interface Props {
  onClose: () => void;
  reduced: boolean;
}

/** Gizli monitörün arkasındaki tek kullanıcı girişi. */
export function LoginScreen({ onClose, reduced }: Props) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    router.prefetch("/panel");
  }, [router]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (entering) return;
    setError("");
    setEntering(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Giriş yapılamadı.");
      setPassword("");
      window.setTimeout(() => router.push("/panel"), reduced ? 0 : 620);
    } catch (cause) {
      setError((cause as Error).message);
      setEntering(false);
    }
  };

  return (
    <div className={styles.screen}>
      <Sky />
      <div className={styles.column}>
        <div className={styles.logoWrap}>
          <p className={styles.logo} aria-hidden="true">
            ANUBIX
          </p>
          <p className={styles.splash} aria-hidden="true">
            Kendi dünyan!
          </p>
        </div>

        <section className={styles.panel} aria-labelledby="login-title">
          <h2 id="login-title" className={styles.title}>
            Kişisel alan
          </h2>
          <p className={styles.notice}>Bu alan yalnızca sana ait. İlk kullanımda terminalde <code>npm run setup</code> çalıştırarak kullanıcı adı ve parola belirle.</p>
          <form onSubmit={login}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Kullanıcı adı</span>
              <input type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className={styles.field}>
              <span>Parola</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          </div>
          {error ? <p className={styles.notice} role="alert">{error}</p> : null}
          <div className={styles.buttons}>
            <button type="submit" className={styles.play} disabled={entering}>
              ▶ {entering ? "Dünyaya giriliyor…" : "Giriş yap"}
            </button>
            <button type="button" className={styles.back} onClick={onClose}>
              ← Odaya dön
            </button>
          </div>
          </form>
        </section>

        <p className={styles.footer}>Anubix · kişisel dünya</p>
      </div>
      {entering && !reduced ? <PixelWipe /> : null}
    </div>
  );
}

/** Yıldızlı gece göğü ve piksel tepeler (özgün çizim). */
function Sky() {
  const rand = seeded(42);
  const stars = Array.from({ length: 46 }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 55,
    s: rand() > 0.8 ? 4 : 2,
    d: rand() * 4,
  }));
  return (
    <div className={styles.sky} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className={styles.star}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
        />
      ))}
      <div className={styles.moon} />
      <div className={styles.hillsBack} />
      <div className={styles.hillsFront} />
      <div className={styles.cubes}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

/** Dünyaya girerken ekranı blok blok kaplayan geçiş. */
function PixelWipe() {
  const rand = seeded(7);
  const cells = Array.from({ length: 12 * 8 }, (_, i) => ({ id: i, delay: Math.round(rand() * 420) }));
  return (
    <div className={styles.wipe} aria-hidden="true">
      {cells.map((c) => (
        <span key={c.id} style={{ animationDelay: `${c.delay}ms` }} />
      ))}
    </div>
  );
}
