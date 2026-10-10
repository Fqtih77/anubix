"use client";

import { type CSSProperties, type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import type { P2 } from "@/lib/iso";
import styles from "./ScreenDialog.module.css";

/**
 * MONİTÖRDEN TAM EKRANA GEÇİŞ
 * ---------------------------
 * Odadaki monitör ekranı izometrik bir paralelkenardır. Diyalog açılırken içerik önce
 * tam o paralelkenarın üstüne "yapıştırılır" (bir matris dönüşümüyle), sonra adım adım
 * düz, tam ekran bir dikdörtgene açılır. Kapanırken aynı yol tersinden oynar.
 *
 * Doğal `<dialog>` kullanılır: odak içeride tutulur, Esc ile kapanır, arka plan
 * ekran okuyucudan gizlenir. Kapanınca odak, açan düğmeye geri döner.
 */

export interface ScreenCorners {
  tl: P2;
  tr: P2;
  bl: P2;
}

interface Props {
  /** Ekran okuyucunun okuyacağı ad */
  label: string;
  /** Geçiş başında monitör ekranını taklit eden renk */
  veil: string;
  /** Monitör ekranının köşeleri (viewport pikseli); null → basit açılış */
  origin: () => ScreenCorners | null;
  reduced: boolean;
  onClosed: () => void;
  className?: string;
  children: (close: () => void) => ReactNode;
}

const DURATION = 780;

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Tam ekran dikdörtgeni verilen paralelkenara eşleyen matris. */
function cornersToMatrix(c: ScreenCorners, vw: number, vh: number): Matrix {
  return [
    (c.tr[0] - c.tl[0]) / vw,
    (c.tr[1] - c.tl[1]) / vw,
    (c.bl[0] - c.tl[0]) / vh,
    (c.bl[1] - c.tl[1]) / vh,
    c.tl[0],
    c.tl[1],
  ];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Matrisi bileşen bileşen yumuşakça açan ara kareler (dönme titremesi olmadan). */
function matrixFrames(from: Matrix, steps = 18): Keyframe[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = easeInOut(i / steps);
    const m = from.map((v, j) => v + (IDENTITY[j] - v) * t);
    return { transform: `matrix(${m.map((v) => v.toFixed(5)).join(",")})` };
  });
}

export function ScreenDialog({ label, veil, origin, reduced, onClosed, className, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const play = useCallback(
    (direction: "open" | "close"): Animation[] => {
      const surface = surfaceRef.current;
      const veilEl = veilRef.current;
      const content = contentRef.current;
      if (!surface || !veilEl || !content) return [];
      if (reduced) {
        // Hareket azaltıldıysa geçiş yok: ekran doğrudan açılır/kapanır.
        veilEl.style.opacity = "0";
        return [];
      }
      const corners = origin();
      const opts: KeyframeAnimationOptions = {
        duration: DURATION,
        fill: "both",
        direction: direction === "open" ? "normal" : "reverse",
      };
      if (!corners) {
        veilEl.style.opacity = "0";
        return [
          surface.animate(
            [
              { opacity: 0, transform: "scale(0.97)" },
              { opacity: 1, transform: "none" },
            ],
            { ...opts, duration: 280, easing: "ease-out" },
          ),
        ];
      }
      const from = cornersToMatrix(corners, window.innerWidth, window.innerHeight);
      return [
        surface.animate(matrixFrames(from), opts),
        veilEl.animate([{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }], opts),
        content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], opts),
      ];
    },
    [origin, reduced],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: diyalog yalnızca bir kez, takıldığında açılır.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    document.documentElement.dataset.modal = "open";
    const animations = play("open");
    return () => {
      for (const a of animations) a.cancel();
      if (dialog.open) dialog.close();
      delete document.documentElement.dataset.modal;
    };
  }, []);

  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const animations = play("close");
    if (animations.length > 0) {
      // Sekme arka plandaysa animasyon zaman çizelgesi durabilir; süre dolunca yine de kapat.
      await Promise.race([
        Promise.all(animations.map((a) => a.finished.catch(() => undefined))),
        new Promise((resolve) => window.setTimeout(resolve, DURATION + 250)),
      ]);
    }
    dialogRef.current?.close();
    onClosed();
  }, [play, onClosed]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
    >
      <div ref={surfaceRef} className={`${styles.surface} ${className ?? ""}`} style={{ "--veil": veil } as CSSProperties}>
        <div ref={contentRef} className={styles.content}>
          {children(() => void close())}
        </div>
        <div ref={veilRef} className={styles.veil} aria-hidden="true" />
      </div>
    </dialog>
  );
}
