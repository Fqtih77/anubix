"use client";

import { useEffect, useState } from "react";
import styles from "./DueNotice.module.css";

interface Task {
  id: string;
  title: string;
  dateValue: string | null;
  done: boolean;
}

/** Panel açıkken bugün veya geçmiş tarihte kalan görevleri gösterir. */
export function DueNotice() {
  const [due, setDue] = useState<Task[]>([]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/panel/quests", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { items: Task[] };
        const today = new Date().toLocaleDateString("sv-SE");
        if (active) setDue(data.items.filter((item) => !item.done && item.dateValue && item.dateValue <= today));
      } catch {
        // Panel çalışmaya devam eder; ağ geri geldiğinde sonraki kontrol yapılır.
      }
    };
    void check();
    const interval = window.setInterval(() => void check(), 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("anubix:quests-changed", check);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", check); window.removeEventListener("anubix:quests-changed", check); };
  }, []);

  if (!due.length) return null;
  return <aside className={styles.notice} aria-live="polite">
    <strong>Görev anımsatıcısı · {due.length}</strong>
    <span>{due.slice(0, 3).map((item) => item.title).join(" · ")}{due.length > 3 ? "…" : ""}</span>
  </aside>;
}
