"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Hareket tercihi
 * ---------------
 * İşletim sistemindeki "hareketi azalt" ayarına uyar; kullanıcı sayfadaki düğmeyle
 * bunu değiştirebilir. Seçim yalnızca bu tarayıcıda, kolaylık için saklanır.
 * Sonuç `<html data-motion="reduced|full">` olarak yazılır; CSS buna göre animasyonları kapatır.
 */

const KEY = "anubix:motion";
const QUERY = "(prefers-reduced-motion: reduce)";

type Choice = "system" | "reduced" | "full";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const systemPrefersReduced = () => window.matchMedia(QUERY).matches;
const serverSnapshot = () => false;

function readChoice(): Choice {
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === "reduced" || value === "full") return value;
  } catch {
    // Gizli pencere veya engellenmiş depolama: sistem ayarı geçerli.
  }
  return "system";
}

export function useMotionPreference() {
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, serverSnapshot);
  // null → tarayıcıdaki kayıt henüz okunmadı (sunucu çiziminde ve ilk karede).
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    setChoice(readChoice());
  }, []);

  const reduced = choice === "reduced" || (choice !== "full" && system);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const toggle = useCallback(() => {
    const next: Choice = reduced ? "full" : "reduced";
    setChoice(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Saklanamazsa yalnızca bu oturum için geçerli olur.
    }
  }, [reduced]);

  return { reduced, toggle, ready: choice !== null };
}
