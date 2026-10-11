"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RacingGame.module.css";

const MOBILE = { width: 400, height: 640, roadLeft: 54, roadRight: 346, lanes: [103, 200, 297], playerY: 536 };
const DESKTOP = { width: 960, height: 540, roadLeft: 120, roadRight: 840, lanes: [192, 336, 480, 624, 768], playerY: 435 };
type Layout = typeof MOBILE;
const BEST_KEY = "anubix-race-best";
const COLORS = ["#ffd36e", "#75c6ee", "#b9a8f6", "#f29dbb"];

type Phase = "ready" | "playing" | "paused" | "crashed";
type Rival = { x: number; y: number; color: string; passed: boolean };
type Pickup = { x: number; y: number };
type Race = {
  playerX: number;
  distance: number;
  overtakes: number;
  hearts: number;
  rivals: Rival[];
  pickups: Pickup[];
  spawnIn: number;
  pickupIn: number;
  invulnerable: number;
  turboCharges: number;
  turboTime: number;
};

const newRace = (layout: Layout): Race => ({
  playerX: layout.lanes[Math.floor(layout.lanes.length / 2)],
  distance: 0,
  overtakes: 0,
  hearts: 3,
  rivals: [],
  pickups: [],
  spawnIn: 0.9,
  pickupIn: 1.3,
  invulnerable: 0,
  turboCharges: 0,
  turboTime: 0,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const scoreOf = (race: Race) => Math.floor(race.distance) + race.overtakes * 100;
const hudOf = (race: Race) => ({ score: scoreOf(race), hearts: race.hearts, overtakes: race.overtakes, turboCharges: race.turboCharges, turboActive: race.turboTime > 0 });

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, rival = false) {
  ctx.save();
  ctx.translate(x, y);
  if (rival) ctx.rotate(Math.PI);
  ctx.fillStyle = "#111827";
  ctx.fillRect(-28, -24, 11, 20);
  ctx.fillRect(17, -24, 11, 20);
  ctx.fillRect(-28, 14, 11, 20);
  ctx.fillRect(17, 14, 11, 20);
  ctx.fillStyle = "#090d1b";
  ctx.fillRect(-31, 28, 62, 7);
  ctx.fillRect(-25, -38, 50, 7);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(10, -25);
  ctx.lineTo(13, 19);
  ctx.lineTo(21, 28);
  ctx.lineTo(-21, 28);
  ctx.lineTo(-13, 19);
  ctx.lineTo(-10, -25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e8eefc";
  ctx.fillRect(-3, -35, 6, 15);
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(0, -4, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8ce0e5";
  ctx.fillRect(-7, 8, 14, 4);
  ctx.restore();
}

function drawTrack(ctx: CanvasRenderingContext2D, race: Race, phase: Phase, layout: Layout) {
  const { width, height, roadLeft, roadRight, lanes, playerY } = layout;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#143d40";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#25866d";
  for (let y = -74 + (race.distance * 2.5) % 74; y < height; y += 74) {
    ctx.fillRect(roadLeft * 0.35, y, 22, 34);
    ctx.fillRect(width - roadLeft * 0.35 - 20, y + 28, 18, 28);
  }
  ctx.fillStyle = "#26344b";
  ctx.fillRect(roadLeft, 0, roadRight - roadLeft, height);
  ctx.fillStyle = "#313f58";
  ctx.fillRect(roadLeft + 11, 0, roadRight - roadLeft - 22, height);
  const offset = (race.distance * (race.turboTime > 0 ? 7 : 4)) % 48;
  for (let y = -48 + offset; y < height; y += 48) {
    ctx.fillStyle = "#f6f0e4";
    ctx.fillRect(roadLeft, y, 10, 24);
    ctx.fillRect(roadRight - 10, y, 10, 24);
    ctx.fillStyle = "#ef615e";
    ctx.fillRect(roadLeft, y + 24, 10, 24);
    ctx.fillRect(roadRight - 10, y + 24, 10, 24);
  }
  ctx.fillStyle = "#b9c3d4";
  for (let i = 0; i < lanes.length - 1; i++) {
    const x = (lanes[i] + lanes[i + 1]) / 2;
    for (let y = -50 + (race.distance * 4) % 72; y < height; y += 72) ctx.fillRect(x, y, 3, 36);
  }
  for (const pickup of race.pickups) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.fillStyle = "#8df3dc";
    ctx.shadowColor = "#8df3dc";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#123647";
    ctx.beginPath();
    ctx.moveTo(3, -17);
    ctx.lineTo(-10, 2);
    ctx.lineTo(-1, 2);
    ctx.lineTo(-6, 17);
    ctx.lineTo(12, -5);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const rival of race.rivals) drawCar(ctx, rival.x, rival.y, rival.color, true);
  if (race.turboTime > 0) {
    ctx.fillStyle = "rgba(112, 239, 222, .48)";
    ctx.fillRect(race.playerX - 15, playerY + 32, 8, 38 + Math.random() * 20);
    ctx.fillRect(race.playerX + 7, playerY + 32, 8, 38 + Math.random() * 20);
    ctx.strokeStyle = "#8df3dc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(race.playerX, playerY, 47, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (race.invulnerable <= 0 || Math.floor(race.invulnerable * 10) % 2 === 0) drawCar(ctx, race.playerX, playerY, "#f35b55");
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(7, 14, 29, .2)");
  shade.addColorStop(0.25, "rgba(7, 14, 29, 0)");
  shade.addColorStop(1, "rgba(7, 14, 29, .28)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  if (phase === "crashed") {
    ctx.fillStyle = "rgba(242, 89, 84, .15)";
    ctx.fillRect(0, 0, width, height);
  }
}

export function RacingGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wide, setWide] = useState(false);
  const layout = wide ? DESKTOP : MOBILE;
  const raceRef = useRef<Race>(newRace(MOBILE));
  const phaseRef = useRef<Phase>("ready");
  const controls = useRef({ left: false, right: false });
  const bestRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState(hudOf(newRace(MOBILE)));
  const [best, setBest] = useState(0);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const activateTurbo = useCallback(() => {
    const race = raceRef.current;
    if (phaseRef.current !== "playing" || race.turboCharges < 1 || race.turboTime > 0) return;
    race.turboCharges -= 1;
    race.turboTime = 2.8;
    setHud(hudOf(race));
  }, []);

  const begin = () => {
    raceRef.current = newRace(layout);
    controls.current.left = false;
    controls.current.right = false;
    setHud(hudOf(raceRef.current));
    changePhase("playing");
  };

  useEffect(() => {
    const media = window.matchMedia("(min-width: 701px)");
    const sync = () => {
      setWide(media.matches);
      raceRef.current = newRace(media.matches ? DESKTOP : MOBILE);
      setHud(hudOf(raceRef.current));
      changePhase("ready");
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [changePhase]);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY));
      if (Number.isFinite(saved) && saved > 0) {
        bestRef.current = saved;
        setBest(saved);
      }
    } catch {
      // Gizli modda depolama kapalıysa oyun yine çalışır.
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") controls.current.left = true;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") controls.current.right = true;
      if (event.key === " " && !event.repeat) {
        if (phaseRef.current === "paused") changePhase("playing");
        else activateTurbo();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") controls.current.left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") controls.current.right = false;
    };
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === "playing") changePhase("paused");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);
    const ctx = canvasRef.current?.getContext("2d");
    let frame = 0;
    let previous = 0;
    let hudTime = 0;
    let paintedPhase: Phase | null = null;
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      const race = raceRef.current;
      if (phaseRef.current === "playing") {
        const speed = Math.min(320 + race.distance * 0.15, 520);
        const turboSpeed = race.turboTime > 0 ? speed * 1.55 : speed;
        const steer = Number(controls.current.right) - Number(controls.current.left);
        race.playerX = clamp(race.playerX + steer * dt * (wide ? 560 : 320), layout.roadLeft + 34, layout.roadRight - 34);
        race.distance += dt * turboSpeed / 9;
        race.invulnerable = Math.max(0, race.invulnerable - dt);
        race.turboTime = Math.max(0, race.turboTime - dt);
        race.spawnIn -= dt;
        if (race.spawnIn <= 0) {
          const count = Math.random() < (wide ? 0.58 : 0.38) ? 2 : 1;
          const laneIndices = layout.lanes.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, count);
          for (const laneIndex of laneIndices) race.rivals.push({ x: layout.lanes[laneIndex], y: -55, color: COLORS[Math.floor(Math.random() * COLORS.length)], passed: false });
          race.spawnIn = Math.max(0.55, 0.98 - race.distance / 5000) + Math.random() * 0.27;
        }
        race.pickupIn -= dt;
        if (race.pickupIn <= 0) {
          const pickupLane = race.distance < 100 ? Math.floor(layout.lanes.length / 2) : Math.floor(Math.random() * layout.lanes.length);
          race.pickups.push({ x: layout.lanes[pickupLane], y: -35 });
          race.pickupIn = 5 + Math.random() * 3;
        }
        for (const pickup of race.pickups) pickup.y += dt * speed;
        race.pickups = race.pickups.filter((pickup) => {
          if (Math.abs(pickup.x - race.playerX) < 39 && Math.abs(pickup.y - layout.playerY) < 48) {
            race.turboCharges = Math.min(3, race.turboCharges + 1);
            return false;
          }
          return pickup.y < layout.height + 30;
        });
        for (const rival of race.rivals) {
          rival.y += dt * speed;
          if (!rival.passed && rival.y > layout.playerY + 40) {
            rival.passed = true;
            race.overtakes += 1;
          }
          if (race.invulnerable === 0 && race.turboTime === 0 && Math.abs(rival.x - race.playerX) < 37 && Math.abs(rival.y - layout.playerY) < 58) {
            race.hearts -= 1;
            race.invulnerable = 1.4;
            if (race.hearts <= 0) {
              changePhase("crashed");
              const score = scoreOf(race);
              if (score > bestRef.current) {
                bestRef.current = score;
                setBest(score);
                try { window.localStorage.setItem(BEST_KEY, String(score)); } catch { /* Depolama isteğe bağlı. */ }
              }
            }
          }
        }
        race.rivals = race.rivals.filter((rival) => rival.y < layout.height + 60);
        if (time - hudTime > 120 || race.hearts <= 0) {
          setHud(hudOf(race));
          hudTime = time;
        }
      }
      if (ctx && (phaseRef.current === "playing" || paintedPhase !== phaseRef.current)) {
        drawTrack(ctx, race, phaseRef.current, layout);
        paintedPhase = phaseRef.current;
      }
      // Menüde, molada ve yarış bitince boş yere saniyede 60 kare çizme.
      if (phase === "playing" && phaseRef.current === "playing") frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activateTurbo, changePhase, layout, wide, phase]);

  const pointCar = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "playing") return;
    const rect = event.currentTarget.getBoundingClientRect();
    raceRef.current.playerX = clamp((event.clientX - rect.left) / rect.width * layout.width, layout.roadLeft + 34, layout.roadRight - 34);
  };

  const hold = (direction: "left" | "right") => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      controls.current[direction] = true;
    },
    onPointerUp: () => { controls.current[direction] = false; },
    onPointerCancel: () => { controls.current[direction] = false; },
    onLostPointerCapture: () => { controls.current[direction] = false; },
  });

  return (
    <div className={styles.game}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>ANUBIX ARCADE / 01</span><h2>Pit Lane Sprint</h2></div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Oyunu kapat">✕ <span>Kapat</span></button>
      </header>
      <div className={styles.dashboard} aria-live="off">
        <span>PUAN <strong>{hud.score.toLocaleString("tr-TR")}</strong></span>
        <span>GEÇİŞ <strong>{hud.overtakes}</strong></span>
        <span>CAN <strong>{"♥".repeat(hud.hearts)}{"♡".repeat(3 - hud.hearts)}</strong></span>
        <span>TURBO <strong className={hud.turboActive ? styles.turboOn : undefined}>{hud.turboActive ? "AKTİF" : `⚡ ${hud.turboCharges}/3`}</strong></span>
        <span>REKOR <strong>{best.toLocaleString("tr-TR")}</strong></span>
      </div>
      <div className={styles.playArea}>
        <div className={styles.track}>
          <canvas
            ref={canvasRef}
            width={layout.width * 2}
            height={layout.height * 2}
            className={styles.canvas}
            aria-label="Yukarıdan görünen yarış pisti; kırmızı arabayı sağa sola sür, turboları topla"
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointCar(event); }}
            onPointerMove={(event) => { if (event.buttons || event.pointerType === "touch") pointCar(event); }}
          />
          {phase !== "playing" ? (
            <div className={styles.overlay}>
              <div className={styles.overlayCard}>
                <span className={styles.flag} aria-hidden="true">▦</span>
                <h3>{phase === "ready" ? "Işıklar sönünce başla!" : phase === "paused" ? "Pit molası" : "Yarış bitti"}</h3>
                <p>{phase === "crashed" ? `${hud.score.toLocaleString("tr-TR")} puan yaptın. Bir tur daha?` : "Rakiplerden kaç. Pistteki ⚡ turboları topla; Space veya Turbo düğmesiyle kullan."}</p>
                <button type="button" className={styles.start} onClick={phase === "paused" ? () => changePhase("playing") : begin}>
                  {phase === "ready" ? "Yarışa başla" : phase === "paused" ? "Devam et" : "Tekrar oyna"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <footer className={styles.footer}>
        <button type="button" className={styles.steer} aria-label="Sola sür" {...hold("left")}>◀</button>
        <p><span className={styles.desktopHint}>← → veya A / D ile sür · Space ile turbo</span><span className={styles.mobileHint}>Tuşlara basılı tut veya pistte sürükle</span><br />⚡ Topla, doğru anda hızlan!</p>
        <button type="button" className={styles.turboButton} onClick={activateTurbo} disabled={phase !== "playing" || hud.turboCharges < 1 || hud.turboActive} aria-label={`Turbo kullan, ${hud.turboCharges} hak var`}>⚡ Turbo <span>{hud.turboCharges}</span></button>
        <button type="button" className={styles.steer} aria-label="Sağa sür" {...hold("right")}>▶</button>
      </footer>
    </div>
  );
}
