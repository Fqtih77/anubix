/**
 * KAMERA
 * ------
 * Oda tek büyük bir SVG'dir; "kamera" o SVG'yi taşıyan kutuya uygulanan
 * `translate + scale` dönüşümüdür. İki modu vardır:
 *
 *   scroll → sayfa kaydırıldıkça bölgeler arasında yumuşakça gezinir (kaydırma turu)
 *   shot   → bir senaryo kamerayı belirli bir çekime kilitlemiştir (ör. rafa yakın plan)
 *
 * Hesaplar React durumu kullanmaz; dönüşüm doğrudan DOM'a yazılır, böylece kaydırma
 * sırasında bileşenler yeniden çizilmez.
 */

import { type RefObject, useEffect, useMemo, useRef } from "react";
import { boundsOf, boxCorners, clamp, isoP, lerp, type P2, smoothstep } from "@/lib/iso";
import { type Frame, REGIONS, SCENE, SHOTS, type ShotId } from "./layout";

interface Cam {
  /** Kadraj merkezi (tuval pikseli) */
  cx: number;
  cy: number;
  /** Yakınlaştırma */
  k: number;
}

interface Viewport {
  w: number;
  h: number;
  /** Üst çubuk ve alt panel için boş bırakılan alanlar */
  top: number;
  bottom: number;
  side: number;
  compact: boolean;
}

function readViewport(stage: HTMLElement): Viewport {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const short = h < 540;
  const compact = w < 760 || short;
  // Masaüstünde alt panel yarı saydam; oda biraz altına girebilir, bu yüzden pay küçük.
  return {
    w,
    h,
    compact,
    top: short ? 44 : compact ? 64 : 60,
    bottom: short ? 52 : compact ? 176 : 80,
    side: compact ? 8 : 24,
  };
}

function frameBounds(frame: Frame) {
  const points = Array.isArray(frame) ? frame : boxCorners(frame as Exclude<Frame, readonly unknown[]>);
  return boundsOf(points.map(isoP));
}

/** Odanın (maket kaidesi dahil) tuvaldeki sınırları. */
const ROOM_RECT = (() => {
  const r = frameBounds(SHOTS.overview.wide);
  return { x: r.x + SCENE.originX, y: r.y + SCENE.originY, w: r.w, h: r.h };
})();

/**
 * Kamera odanın dışına fazla kaymasın: oda ekrandan büyükse görünür alanı odanın içinde tut.
 * Böylece odanın kenarındaki bir bölgeye (TV, yatak) bakarken yanlarda boş arka plan kalmaz.
 */
function clampToRoom(cam: Cam, vp: Viewport): Cam {
  const m = 24;
  const halfW = vp.w / 2 / cam.k;
  const above = (vp.top + (vp.h - vp.top - vp.bottom) / 2) / cam.k;
  const below = vp.h / cam.k - above;
  const minX = ROOM_RECT.x - m;
  const maxX = ROOM_RECT.x + ROOM_RECT.w + m;
  const minY = ROOM_RECT.y - m;
  const maxY = ROOM_RECT.y + ROOM_RECT.h + m;
  // Oda ekrana sığıyorsa ortala (boşluk iki yana eşit dağılsın), sığmıyorsa içinde tut.
  const cx = maxX - minX <= halfW * 2 ? (minX + maxX) / 2 : clamp(cam.cx, minX + halfW, maxX - halfW);
  const cy = maxY - minY <= above + below ? (minY + maxY) / 2 : clamp(cam.cy, minY + above, maxY - below);
  return { ...cam, cx, cy };
}

function fit(shot: ShotId, vp: Viewport): Cam {
  const s = SHOTS[shot];
  const r = frameBounds(vp.compact ? s.tight : s.wide);
  const pad = s.pad ?? 1.05;
  const availW = Math.max(120, vp.w - vp.side * 2);
  const availH = Math.max(120, vp.h - vp.top - vp.bottom);
  const byW = availW / (r.w * pad);
  const byH = availH / (r.h * pad);
  // "contain": kadrajın tamamı görünür. Geniş ekranda `zoom` kadar daha yakınlaşılır,
  // ama "cover"ı (kadrajın ekranı tam doldurduğu ölçek) geçmeyiz.
  const contain = Math.min(byW, byH);
  const zoom = vp.compact ? 1 : (s.zoom ?? 1);
  let k = Math.min(contain * zoom, Math.max(byW, byH));
  if (!vp.compact && s.fill !== false) {
    // Masaüstünde oda ekranın genişliğini doldursun (16:9 ekranda yanlarda boşluk kalmasın);
    // üst ve alt biraz kırpılabilir. Çok geniş ekranlarda en fazla 1.5 kat yakınlaşılır.
    const fillWidth = vp.w / (ROOM_RECT.w + 48);
    k = Math.max(k, Math.min(fillWidth, contain * 1.5));
  }
  k = clamp(k, 0.15, 4.5);
  return clampToRoom({ cx: r.x + r.w / 2 + SCENE.originX, cy: r.y + r.h / 2 + SCENE.originY, k }, vp);
}

function mixCam(a: Cam, b: Cam, t: number): Cam {
  return {
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), t)),
  };
}

/** Her bölgede kameranın bir süre sabit kalacağı pay (0–0.5). */
const HOLD = 0.2;

function scrollCam(progress: number, vp: Viewport) {
  const n = REGIONS.length;
  const t = clamp(progress, 0, 1) * (n - 1);
  const i = Math.min(Math.floor(t), n - 2);
  const f = t - i;
  const e = smoothstep(clamp((f - HOLD) / (1 - 2 * HOLD), 0, 1));
  return {
    cam: mixCam(fit(REGIONS[i].shot, vp), fit(REGIONS[i + 1].shot, vp), e),
    region: Math.round(t),
  };
}

const EASE = "cubic-bezier(0.65, 0, 0.3, 1)";

export interface CameraApi {
  /** Kamerayı bir çekime götürür; animasyon bitince çözülür. */
  toShot(shot: ShotId, ms?: number): Promise<void>;
  /** Kamerayı tekrar kaydırma turuna bağlar. */
  release(ms?: number): Promise<void>;
  /** Açılış: geniş plandan kaydırma konumuna süzülür. */
  intro(ms: number): Promise<void>;
  /** Sayfayı ilgili bölgenin kaydırma konumuna götürür. */
  goToRegion(index: number, smooth: boolean): void;
  /** Senaryo sürerken kullanıcı kaydırsa da kamera çekimde kalsın mı? */
  lock(locked: boolean): void;
  /** Tuval pikselini ekran (viewport) pikseline çevirir. */
  worldToClient(p: P2): P2;
  isShot(): boolean;
}

interface Options {
  stageRef: RefObject<HTMLDivElement | null>;
  worldRef: RefObject<HTMLDivElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLElement | null>;
  onRegion: (index: number) => void;
}

export function useCamera({ stageRef, worldRef, layerRef, trackRef, onRegion }: Options): CameraApi {
  const mode = useRef<"scroll" | "shot" | "releasing">("scroll");
  const shot = useRef<ShotId | null>(null);
  const current = useRef<Cam>({ cx: SCENE.width / 2, cy: SCENE.height / 2, k: 0.6 });
  const locked = useRef(false);
  const scrollAtShot = useRef(0);
  const region = useRef(-1);
  const timers = useRef(new Set<number>());
  const idleTimer = useRef(0);
  const onRegionRef = useRef(onRegion);

  useEffect(() => {
    onRegionRef.current = onRegion;
  }, [onRegion]);

  const api = useMemo(() => {
    const viewport = () => (stageRef.current ? readViewport(stageRef.current) : null);

    const progress = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const range = track.offsetHeight - window.innerHeight;
      if (range <= 0) return 0;
      return clamp(-track.getBoundingClientRect().top / range, 0, 1);
    };

    const apply = (cam: Cam, ms: number) => {
      const world = worldRef.current;
      const vp = viewport();
      if (!world || !vp) return;
      const tx = vp.w / 2 - cam.cx * cam.k;
      const ty = vp.top + (vp.h - vp.top - vp.bottom) / 2 - cam.cy * cam.k;
      // Opaklık geçişi açılışta odanın belirmesi için korunur.
      world.style.transition = ms > 0 ? `transform ${ms}ms ${EASE}, opacity 0.7s ease` : "opacity 0.7s ease";
      world.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${cam.k.toFixed(4)})`;
      layerRef.current?.style.setProperty("--cam-k", cam.k.toFixed(4));
      current.current = cam;
    };

    const later = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          timers.current.delete(id);
          resolve();
        }, ms);
        timers.current.add(id);
      });

    const reportRegion = () => {
      const vp = viewport();
      if (!vp) return null;
      const result = scrollCam(progress(), vp);
      if (result.region !== region.current) {
        region.current = result.region;
        onRegionRef.current(result.region);
      }
      return result;
    };

    const release = async (ms = 900) => {
      const vp = viewport();
      if (!vp) return;
      mode.current = "releasing";
      shot.current = null;
      apply(scrollCam(progress(), vp).cam, ms);
      await later(ms);
      if (mode.current === "releasing") {
        mode.current = "scroll";
        const fresh = viewport();
        if (fresh) apply(scrollCam(progress(), fresh).cam, 0);
      }
    };

    const camera: CameraApi & { _update(): void; _resize(): void } = {
      async toShot(id, ms = 900) {
        const vp = viewport();
        if (!vp) return;
        mode.current = "shot";
        shot.current = id;
        scrollAtShot.current = window.scrollY;
        apply(fit(id, vp), ms);
        if (ms > 0) await later(ms);
      },
      release,
      async intro(ms) {
        const vp = viewport();
        if (!vp) return;
        apply(fit("intro", vp), 0);
        reportRegion();
        // Bir kare bekle ki tarayıcı başlangıç konumunu çizsin, sonra süzül.
        // Sekme arka plandaysa requestAnimationFrame çalışmaz; kısa bir zaman aşımı yedek olur.
        await Promise.race([
          new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
          later(120),
        ]);
        await release(ms);
      },
      goToRegion(index, smooth) {
        const track = trackRef.current;
        if (!track) return;
        const range = track.offsetHeight - window.innerHeight;
        const top = track.getBoundingClientRect().top + window.scrollY;
        const target = top + (range * clamp(index, 0, REGIONS.length - 1)) / (REGIONS.length - 1);
        if (mode.current === "shot" && !locked.current) void release(smooth ? 700 : 0);
        window.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
      },
      lock(v) {
        locked.current = v;
      },
      worldToClient([x, y]) {
        const stage = stageRef.current;
        const vp = viewport();
        if (!stage || !vp) return [x, y];
        const rect = stage.getBoundingClientRect();
        const cam = current.current;
        const tx = vp.w / 2 - cam.cx * cam.k;
        const ty = vp.top + (vp.h - vp.top - vp.bottom) / 2 - cam.cy * cam.k;
        return [rect.left + tx + x * cam.k, rect.top + ty + y * cam.k];
      },
      isShot: () => mode.current === "shot",
      _update() {
        const result = reportRegion();
        if (!result) return;
        const world = worldRef.current;
        if (mode.current === "scroll") {
          apply(result.cam, 0);
          if (world) {
            // Kaydırma sürerken katmanı GPU'da tut, durunca keskin yeniden çizim için bırak.
            world.dataset.moving = "true";
            window.clearTimeout(idleTimer.current);
            idleTimer.current = window.setTimeout(() => {
              delete world.dataset.moving;
            }, 180);
          }
        } else if (mode.current === "shot" && !locked.current) {
          // Kalıcı bir sahnede (oyun, uyku) kullanıcı kaydırırsa kamerayı geri ver.
          if (Math.abs(window.scrollY - scrollAtShot.current) > 80) void release(700);
        }
      },
      _resize() {
        const vp = viewport();
        if (!vp) return;
        if (mode.current === "shot" && shot.current) apply(fit(shot.current, vp), 0);
        else apply(scrollCam(progress(), vp).cam, 0);
      },
    };
    return camera;
  }, [stageRef, worldRef, layerRef, trackRef]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          api._update();
        });
    };
    const onResize = () => api._resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const pending = timers.current;
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      for (const t of pending) window.clearTimeout(t);
    };
  }, [api]);

  return api;
}
