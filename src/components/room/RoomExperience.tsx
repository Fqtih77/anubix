"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { QuickLook } from "@/components/home/QuickLook";
import { CvScreen } from "@/components/screens/CvScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ProjectsDesktop } from "@/components/screens/ProjectsDesktop";
import { RacingGame } from "@/components/screens/RacingGame";
import { ScreenDialog, type ScreenCorners } from "@/components/screens/ScreenDialog";
import type { Project } from "@/data/projects";
import { type Box3, box, clamp, faceCorners, inflate, iso, type P2, silhouette } from "@/lib/iso";
import { useMotionPreference } from "@/lib/useMotionPreference";
import { type Bubble, HotspotLayer, type HotspotDef } from "./Hotspots";
import {
  BED_CORNER,
  LIGHT_SWITCH,
  MONITORS,
  RECORD_IDS,
  type RecordId,
  RECORDS,
  REGIONS,
  SCENE,
  SCREENS,
  TV_CORNER,
} from "./layout";
import styles from "./RoomExperience.module.css";
import { RoomHud } from "./RoomHud";
import { createRoomStore, type Overlay } from "./roomStore";
import { type IntroPhase, RoomScene } from "./scene/RoomScene";
import {
  chillScript,
  type Director,
  greetScript,
  idleScript,
  loginScript,
  mainMonitorScript,
  recordScript,
  restScript,
  resumeGameScript,
  type Script,
  WALK_SPEED,
  wakeScript,
  walkSegments,
} from "./scripts";
import { useCamera } from "./useCamera";

/**
 * ODA DENEYİMİ
 * ------------
 * Ana sayfanın kalbi. Burada üç şey bir araya gelir:
 *   1. Sahne (RoomScene): izometrik SVG oda ve avatar
 *   2. Kamera (useCamera): kaydırmayla ya da senaryoyla hareket eden bakış
 *   3. Yönetmen (run): bir nesneye tıklanınca ilgili senaryoyu (scripts.ts) oynatır
 *
 * Aynı anda yalnızca bir senaryo oynar. Kullanıcı başka bir şeye tıklarsa avatar
 * "bir saniye" der; "Atla" düğmesi ya da Esc senaryoyu hemen son durumuna getirir.
 */

interface Running {
  script: Script;
  controller: AbortController;
  settled: boolean;
}

const toWorldPolygon = (boxes: Box3[], pad = 0): P2[] =>
  inflate(silhouette(boxes), pad).map(([x, y]) => [x + SCENE.originX, y + SCENE.originY] as P2);

export function RoomExperience({ projects }: { projects: Project[] }) {
  const { reduced, toggle: toggleMotion, ready: motionReady } = useMotionPreference();
  const [store] = useState(() => createRoomStore());
  const state = useSyncExternalStore(store.subscribe, store.get, store.getInitial);

  const [intro, setIntro] = useState<IntroPhase>("pending");
  const [regionIndex, setRegionIndex] = useState(0);
  /** Oynayan senaryo. `quiet` olanlar (boşta hareketler) arayüzü meşgul göstermez. */
  const [running, setRunning] = useState<{ id: string; quiet: boolean } | null>(null);
  const [hotId, setHotId] = useState<string | null>(null);
  const [explored, setExplored] = useState(false);
  /** Ekran okuyucuya giden kısa duyuru (ör. "Işıklar kapandı") */
  const [announce, setAnnounce] = useState("");

  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef<Running | null>(null);
  const reducedRef = useRef(reduced);
  const regionRef = useRef(0);
  const lastInput = useRef(0);
  const bubbleTimer = useRef(0);
  /** Proje masaüstü açıkken Esc önce açık projeyi kapatsın diye masaüstünün kendi işleyicisi */
  const desktopEscape = useRef<() => boolean>(() => false);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const onRegion = useCallback((i: number) => {
    regionRef.current = i;
    setRegionIndex(i);
    if (i !== 0) setExplored(true);
  }, []);

  /** Sahne ekranda mı? (Kullanıcı aşağıdaki hızlı listeye inmiş olabilir.) */
  const stageVisible = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    return rect ? rect.bottom > window.innerHeight * 0.5 : false;
  }, []);

  const camera = useCamera({ stageRef, worldRef, layerRef, trackRef, onRegion });

  /* ---------- Yönetmen: senaryoların kullandığı araçlar ---------- */

  const createDirector = useCallback(
    (signal: AbortSignal | null): Director => {
      const instant = signal === null;
      const wait = (ms: number) =>
        new Promise<void>((resolve, reject) => {
          if (instant) return resolve();
          if (signal.aborted) return reject(signal.reason);
          const timer = window.setTimeout(resolve, ms);
          signal.addEventListener(
            "abort",
            () => {
              window.clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true },
          );
        });
      const d: Director = {
        state: store.get,
        wait,
        avatar: (patch) => store.update((s) => ({ ...s, avatar: { ...s.avatar, ...patch } })),
        room: (patch) => store.update((s) => ({ ...s, room: { ...s.room, ...patch } })),
        activity: (activity) => store.update((s) => ({ ...s, activity })),
        async walk(path, speed = WALK_SPEED) {
          for (const seg of walkSegments(store.get().avatar.pos, path, speed)) {
            if (instant) {
              d.avatar({ pos: seg.to, facing: seg.facing, moveMs: 0 });
              continue;
            }
            d.avatar({ pos: seg.to, facing: seg.facing, moveMs: seg.ms, pose: "walk" });
            await wait(seg.ms);
          }
          d.avatar({ pose: store.get().avatar.holding ? "carry" : "stand", moveMs: 0 });
        },
        camera: (shot) => camera.toShot(shot, instant || reducedRef.current ? 0 : 950),
        cameraJump: (shot) => void camera.toShot(shot, 0),
        releaseCamera: () => camera.release(instant || reducedRef.current ? 0 : 900),
        status: (text) => store.update((s) => ({ ...s, status: text })),
        say(text) {
          const id = Date.now();
          store.update((s) => ({ ...s, bubble: { text, id }, status: text }));
          window.clearTimeout(bubbleTimer.current);
          bubbleTimer.current = window.setTimeout(() => {
            store.update((s) => (s.bubble?.id === id ? { ...s, bubble: null } : s));
          }, 2800);
        },
        open: (overlay) => {
          camera.lock(true);
          store.update((s) => ({ ...s, overlay }));
        },
      };
      return d;
    },
    [store, camera],
  );

  /** Senaryoyu bitirir: "finish" → son duruma anında atla, "complete" → zaten bitti. */
  const settle = useCallback(
    (entry: Running, how: "finish" | "complete") => {
      if (entry.settled) return;
      entry.settled = true;
      if (how === "finish") entry.script.finish(createDirector(null));
      if (runningRef.current === entry) {
        runningRef.current = null;
        setRunning(null);
        if (!store.get().overlay) camera.lock(false);
      }
    },
    [createDirector, camera, store],
  );

  const run = useCallback(
    async (script: Script) => {
      const current = runningRef.current;
      if (current) {
        if (!current.script.interruptible) {
          createDirector(null).say("Bir saniye, elimdeki işi bitireyim!");
          return;
        }
        current.controller.abort("interrupt");
        settle(current, "finish");
      }
      if (store.get().overlay) return;

      const entry: Running = { script, controller: new AbortController(), settled: false };
      runningRef.current = entry;
      setRunning({ id: script.id, quiet: script.quiet ?? false });
      if (!script.keepCamera) camera.lock(true);

      if (reducedRef.current) {
        // Hareket azaltıldıysa senaryo oynamaz; sonuç anında gösterilir.
        settle(entry, "finish");
        return;
      }
      try {
        await script.run(createDirector(entry.controller.signal));
        settle(entry, "complete");
      } catch (error) {
        if (entry.controller.signal.aborted) {
          if (entry.controller.signal.reason !== "unmount") settle(entry, "finish");
        } else {
          console.error(error);
          settle(entry, "finish");
        }
      }
    },
    [camera, createDirector, settle, store],
  );

  const skip = useCallback(() => {
    const current = runningRef.current;
    if (!current) return;
    current.controller.abort("skip");
    settle(current, "finish");
  }, [settle]);

  /** Yatağın yanındaki düğme: odanın ışığı (açık / koyu tema). Tercih bu tarayıcıda saklanır. */
  const toggleLights = useCallback(() => {
    const next = store.get().room.lights === "on" ? "off" : "on";
    store.update((s) => ({ ...s, room: { ...s.room, lights: next } }));
    setAnnounce(next === "off" ? "Işıklar kapandı, gece modu açık." : "Işıklar açıldı.");
    try {
      window.localStorage.setItem("anubix:lights", next);
    } catch {
      // Saklanamazsa yalnızca bu ziyaret için geçerli olur.
    }
  }, [store]);

  const backToDesk = useCallback(() => {
    const activity = store.get().activity;
    if (activity === "gaming") void run(chillScript("gaming"));
    else if (activity === "sleeping") void run(wakeScript());
  }, [run, store]);

  /* ---------- Tıklanabilir nesneler ---------- */

  const hotspots = useMemo<HotspotDef[]>(
    () => [
      {
        id: "avatar",
        label: "Avatar",
        hint: "Selam ver",
        ariaLabel: "Avatar: selam ver",
        region: "desk",
        polygon: toWorldPolygon([box(6.25, 3.95, 2.3, 2.2, 1.9, 4.9)]),
      },
      {
        id: "main-monitor",
        label: "Ana monitör",
        hint: "Takılı plağı aç",
        ariaLabel: "Ana monitör: bilgisayara takılı plağın ekranını aç (CV ya da proje masaüstü)",
        region: "desk",
        polygon: toWorldPolygon([MONITORS.main], 4),
      },
      {
        id: "secret-monitor",
        label: "Dikey monitör",
        hint: "Burada bir şey var gibi…",
        ariaLabel: "Dikey monitör: gizli kişisel alan girişi",
        region: "desk",
        polygon: toWorldPolygon([MONITORS.vertical], 10),
        marker: "secret",
      },
      ...RECORD_IDS.map<HotspotDef>((id) => {
        const record = RECORDS[id];
        return {
          id: `record:${id}`,
          label: id === "cv" ? "CV plağı" : "Projeler plağı",
          hint: record.hint,
          ariaLabel:
            id === "cv"
              ? "CV plağı: avatar plağı alıp bilgisayara takar ve özgeçmiş ekranı açılır"
              : "Projeler plağı: avatar plağı alıp bilgisayara takar ve proje masaüstü açılır",
          region: "records",
          polygon: toWorldPolygon([record.frame], 6),
          marker: "spark",
        };
      }),
      {
        id: "bean-bag",
        label: "Puf",
        hint: "Yarışa geç",
        ariaLabel: "Puf: avatar pufa geçer, kulaklığını takar ve yarış oyununu açar",
        region: "tv",
        polygon: toWorldPolygon([box(8.55, 11.45, 0, 3.5, 3.5, 2.3)], 2),
        marker: "spark",
      },
      {
        id: "tv",
        label: "Televizyon",
        hint: "Yarışı aç",
        ariaLabel: "Televizyon: yarış oyununu aç",
        region: "tv",
        polygon: toWorldPolygon([TV_CORNER.tv], 6),
      },
      {
        id: "bed",
        label: "Yatak",
        hint: "Kısa şekerleme",
        ariaLabel: "Yatak: avatar kısa bir şekerleme yapar",
        region: "bed",
        polygon: toWorldPolygon([BED_CORNER.base, BED_CORNER.headboard, BED_CORNER.duvet]),
        marker: "spark",
      },
      {
        id: "light-switch",
        label: "Işık düğmesi",
        hint: "Işığı aç / kapat",
        ariaLabel: "Işık düğmesi: odanın ışığını aç ya da kapat (koyu tema)",
        region: "bed",
        polygon: toWorldPolygon([LIGHT_SWITCH], 14),
        marker: "secret",
      },
    ],
    [],
  );

  const activate = useCallback(
    (id: string) => {
      setExplored(true);
      const activity = store.get().activity;
      if (id === "avatar") {
        // Avatar masasında değilse (oyun, uyku) önce masasına döner.
        if (activity === "desk") void run(greetScript());
        else backToDesk();
      } else if (id === "main-monitor") void run(mainMonitorScript(store.get().room.loadedRecord));
      else if (id === "secret-monitor") void run(loginScript());
      else if (id === "bean-bag") void run(chillScript(activity));
      else if (id === "tv") void run(activity === "gaming" ? resumeGameScript() : chillScript(activity));
      else if (id === "bed") void run(restScript(activity));
      else if (id === "light-switch") toggleLights();
      else if (id.startsWith("record:")) {
        const record = id.slice("record:".length);
        if (record === "cv" || record === "projects") void run(recordScript(record as RecordId));
      }
    },
    [run, store, backToDesk, toggleLights],
  );

  const onFocusSpot = useCallback(
    (spot: HotspotDef) => {
      if (runningRef.current || store.get().overlay || camera.isShot()) return;
      const target = REGIONS.findIndex((r) => r.id === spot.region);
      const current = REGIONS[regionRef.current]?.id;
      if (target >= 0 && current !== "room" && target !== regionRef.current) {
        camera.goToRegion(target, !reducedRef.current);
      }
    },
    [camera, store],
  );

  const goRegion = useCallback(
    (i: number) => {
      setExplored(true);
      camera.goToRegion(clamp(i, 0, REGIONS.length - 1), !reducedRef.current);
    },
    [camera],
  );

  /* ---------- Tam ekran katmanlar (proje tanıtımı, giriş) ---------- */

  const openDirect = useCallback(
    (overlay: Overlay) => {
      if (runningRef.current) skip();
      camera.lock(true);
      store.update((s) => ({ ...s, overlay: { ...overlay, direct: true } }));
    },
    [camera, skip, store],
  );

  const overlayOrigin = useCallback((): ScreenCorners | null => {
    const overlay = store.get().overlay;
    if (!overlay || overlay.direct) return null;
    const face = overlay.kind === "login" ? SCREENS.vertical : overlay.kind === "game" ? SCREENS.tv : SCREENS.main;
    // cv ve desktop ana monitörden büyür.
    const c = faceCorners(face.plane, face.at, face.w, face.h);
    const toClient = (p: P2) => camera.worldToClient([p[0] + SCENE.originX, p[1] + SCENE.originY]);
    return { tl: toClient(c.tl), tr: toClient(c.tr), bl: toClient(c.bl) };
  }, [camera, store]);

  const onOverlayClosed = useCallback(() => {
    store.update((s) => ({
      ...s,
      overlay: null,
      status: "",
      room: s.overlay?.kind === "login" ? { ...s.room, verticalScreen: "saver" } : s.room,
    }));
    camera.lock(false);
    void camera.release(reducedRef.current ? 0 : 900);
  }, [camera, store]);

  /* ---------- Işık tercihi ve sayfa teması ---------- */

  useEffect(() => {
    try {
      if (window.localStorage.getItem("anubix:lights") === "off") {
        store.update((s) => ({ ...s, room: { ...s.room, lights: "off" } }));
      }
    } catch {
      // Tarayıcı depolaması kapalıysa ışıklar açık başlar.
    }
  }, [store]);

  const lights = state.room.lights;
  useEffect(() => {
    document.documentElement.dataset.theme = lights === "off" ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [lights]);

  /* ---------- Açılış animasyonu ---------- */

  const introStarted = useRef(false);
  useEffect(() => {
    if (!motionReady || introStarted.current) return;
    introStarted.current = true;
    if (reducedRef.current) {
      setIntro("done");
      void camera.release(0);
      return;
    }
    setIntro("playing");
    void camera.intro(1600).then(() => setIntro("done"));
  }, [motionReady, camera]);

  /* ---------- Klavye, kaydırma hareketi, boşta kalma ---------- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      lastInput.current = Date.now();
      if (store.get().overlay) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (event.key === "Escape") {
        // Atlanan senaryo bir ekran açabilir; aynı Esc onu hemen kapatmasın.
        event.preventDefault();
        if (runningRef.current) skip();
        else backToDesk();
        return;
      }
      // Ok tuşları yalnızca oda ekrandayken ve odak odanın içindeyken bölge değiştirir.
      const focusInStage = target === document.body || (target !== null && stageRef.current?.contains(target));
      if (!focusInStage || !stageVisible() || event.altKey) return;
      if (event.key === "ArrowRight") goRegion(regionRef.current + 1);
      else if (event.key === "ArrowLeft") goRegion(regionRef.current - 1);
    };
    const markInput = () => {
      lastInput.current = Date.now();
    };
    lastInput.current = Date.now();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", markInput, { passive: true });
    window.addEventListener("wheel", markInput, { passive: true });
    window.addEventListener("touchstart", markInput, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", markInput);
      window.removeEventListener("wheel", markInput);
      window.removeEventListener("touchstart", markInput);
    };
  }, [backToDesk, goRegion, skip, store, stageVisible]);

  // Telefonda yatay kaydırma (swipe) ile bölge değiştirme. Dikey kaydırma tarayıcıda kalır.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let start: { x: number; y: number; id: number } | null = null;
    let swallowClick = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        swallowClick = true;
        window.setTimeout(() => {
          swallowClick = false;
        }, 400);
        goRegion(regionRef.current + (dx < 0 ? 1 : -1));
      }
    };
    const cancel = () => {
      start = null;
    };
    const click = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    };
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", cancel);
    stage.addEventListener("click", click, true);
    return () => {
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", cancel);
      stage.removeEventListener("click", click, true);
    };
  }, [goRegion]);

  // Boştayken küçük hareketler; çok uzun süre dokunulmazsa kısa bir şekerleme.
  useEffect(() => {
    if (intro !== "done" || reduced) return;
    let timer = 0;
    let napped = false;
    const tick = () => {
      const s = store.get();
      const calm =
        !runningRef.current &&
        s.activity === "desk" &&
        !s.overlay &&
        document.visibilityState === "visible" &&
        stageVisible();
      if (calm) {
        if (!napped && Date.now() - lastInput.current > 75_000) {
          napped = true;
          void run(restScript("desk", { auto: true }));
        } else {
          const kinds = ["peek", "glance", "stretch", "pause"] as const;
          void run(idleScript(kinds[Math.floor(Math.random() * kinds.length)]));
        }
      }
      timer = window.setTimeout(tick, 9000 + Math.random() * 7000);
    };
    timer = window.setTimeout(tick, 7000);
    return () => window.clearTimeout(timer);
  }, [intro, reduced, run, store, stageVisible]);

  // Kullanıcının başlattığı şekerleme kısa sürer: avatar birkaç saniye sonra kendiliğinden kalkar.
  useEffect(() => {
    if (state.activity !== "sleeping" || running !== null) return;
    const timer = window.setTimeout(() => {
      if (store.get().activity === "sleeping" && !runningRef.current) void run(wakeScript());
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [state.activity, running, run, store]);

  // Sayfadan ayrılırken oynayan senaryoyu sessizce durdur.
  useEffect(
    () => () => {
      const current = runningRef.current;
      if (current) {
        current.settled = true;
        current.controller.abort("unmount");
      }
      window.clearTimeout(bubbleTimer.current);
    },
    [],
  );

  /* ---------- Çizim ---------- */

  const bubble: Bubble | null = useMemo(() => {
    if (!state.bubble) return null;
    const [x, y, z] = state.avatar.pos;
    const [bx, by] = iso(x, y, z + (z > 1 ? 5.3 : 7.6));
    return { ...state.bubble, at: [bx + SCENE.originX, by + SCENE.originY] };
  }, [state.bubble, state.avatar.pos]);

  const overlay = state.overlay;
  const busy = running !== null && !running.quiet;
  const calm = busy || overlay !== null || intro !== "done";
  const region = REGIONS[regionIndex] ?? REGIONS[0];

  return (
    <main className={styles.experience}>
      <h1 className={styles.srOnly}>Anubix · kişisel dijital odam</h1>
      <section
        ref={trackRef}
        className={styles.track}
        style={{ "--regions": REGIONS.length } as CSSProperties}
        aria-label="Etkileşimli oda"
      >
        <div ref={stageRef} className={styles.stage} data-intro={intro} data-lights={lights}>
          <div className={styles.backdrop} aria-hidden="true" />
          <p className={styles.srOnly}>
            Açık renkli, izometrik bir çalışma odası. Ortada iki yatay ve bir dikey monitörlü beyaz bir masa ve
            masada oturan bir avatar var. Sol duvarda içinde plak olan iki tablo (CV ve projeler) ve televizyon,
            sağda pencere, yatak ve ışık düğmesi bulunuyor. Nesneler düğme olarak kullanılabilir; aşağıda
            animasyonsuz hızlı liste de var.
          </p>
          <p className={styles.srOnly} aria-live="polite">
            {announce}
          </p>
          <div ref={worldRef} className={styles.world} style={{ width: SCENE.width, height: SCENE.height }}>
            <RoomScene
              room={state.room}
              avatar={state.avatar}
              intro={intro}
              calm={calm}
              hotId={hotId}
            />
            <HotspotLayer
              ref={layerRef}
              hotspots={hotspots}
              busy={busy}
              activeRegion={region.id}
              showMarkers={intro === "done" && !busy && state.activity === "desk"}
              bubble={bubble}
              onActivate={activate}
              onHot={setHotId}
              onFocusSpot={onFocusSpot}
            />
          </div>
          <RoomHud
            regionIndex={regionIndex}
            onRegion={goRegion}
            status={state.status}
            running={busy}
            onSkip={skip}
            activity={state.activity}
            onReturn={backToDesk}
            reduced={reduced}
            onToggleMotion={toggleMotion}
            showExploreHint={intro === "done" && !explored && regionIndex === 0}
          />
        </div>
      </section>

      <QuickLook
        projects={projects}
        onOpenProject={(id) => openDirect({ kind: "desktop", projectId: id })}
        onOpenCv={() => openDirect({ kind: "cv" })}
        onBackToRoom={() => goRegion(0)}
      />

      {overlay?.kind === "cv" ? (
        <ScreenDialog
          label="Özgeçmiş"
          veil="#eef2f8"
          origin={overlayOrigin}
          reduced={reduced}
          onClosed={onOverlayClosed}
        >
          {(close) => <CvScreen onClose={close} />}
        </ScreenDialog>
      ) : null}
      {overlay?.kind === "desktop" ? (
        <ScreenDialog
          label="Proje masaüstü"
          veil={RECORDS.projects.color}
          origin={overlayOrigin}
          reduced={reduced}
          onClosed={onOverlayClosed}
          onEscape={() => desktopEscape.current()}
        >
          {(close) => (
            <ProjectsDesktop
              projects={projects}
              initialProjectId={overlay.projectId ?? null}
              onClose={close}
              registerEscape={(handler) => {
                desktopEscape.current = handler;
              }}
            />
          )}
        </ScreenDialog>
      ) : null}
      {overlay?.kind === "login" ? (
        <ScreenDialog
          label="Kişisel alan girişi"
          veil="#3f8f43"
          origin={overlayOrigin}
          reduced={reduced}
          onClosed={onOverlayClosed}
        >
          {(close) => <LoginScreen onClose={close} reduced={reduced} />}
        </ScreenDialog>
      ) : null}
      {overlay?.kind === "game" ? (
        <ScreenDialog
          label="Anubix yarış oyunu"
          veil="#101c32"
          origin={overlayOrigin}
          reduced={reduced}
          onClosed={onOverlayClosed}
        >
          {(close) => <RacingGame onClose={close} />}
        </ScreenDialog>
      ) : null}
    </main>
  );
}
