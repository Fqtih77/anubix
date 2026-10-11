"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RacingGame.module.css";

const WIDTH = 400;
const HEIGHT = 640;
const ROAD_LEFT = 54;
const ROAD_RIGHT = 346;
const LANES = [103, 200, 297];
const BEST_KEY = "anubix-race-best";

type Phase = "ready" | "playing" | "paused" | "crashed";
type Rival = { x: number; y: number; color: string; passed: boolean };
type Race = {
  playerX: number;
  distance: number;
  overtakes: number;
  hearts: number;
  rivals: Rival[];
  spawnIn: number;
  invulnerable: number;
};

const newRace = (): Race => ({
  playerX: LANES[1],
  distance: 0,
  overtakes: 0,
  hearts: 3,
  rivals: [],
  spawnIn: 1.1,
  invulnerable: 0,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const scoreOf = (race: Race) => Math.floor(race.distance) + race.overtakes * 100;

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

function drawTrack(ctx: CanvasRenderingContext2D, race: Race, phase: Phase) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#143d40";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#25866d";
  for (let i = -1; i < 12; i++) {
    const y = ((i * 74 + race.distance * 2.5) % (HEIGHT + 74)) - 74;
    ctx.fillRect(11, y, 22, 34);
    ctx.fillRect(367, y + 28, 18, 28);
  }
  ctx.fillStyle = "#26344b";
  ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, HEIGHT);
  ctx.fillStyle = "#313f58";
  ctx.fillRect(ROAD_LEFT + 11, 0, ROAD_RIGHT - ROAD_LEFT - 22, HEIGHT);

  const offset = (race.distance * 4) % 48;
  for (let y = -48 + offset; y < HEIGHT; y += 48) {
    ctx.fillStyle = "#f6f0e4";
    ctx.fillRect(ROAD_LEFT, y, 10, 24);
    ctx.fillRect(ROAD_RIGHT - 10, y, 10, 24);
    ctx.fillStyle = "#ef615e";
    ctx.fillRect(ROAD_LEFT, y + 24, 10, 24);
    ctx.fillRect(ROAD_RIGHT - 10, y + 24, 10, 24);
  }
  ctx.fillStyle = "#b9c3d4";
  for (const x of [151, 249]) {
    for (let y = -50 + (race.distance * 4) % 72; y < HEIGHT; y += 72) ctx.fillRect(x, y, 3, 36);
  }
  for (const rival of race.rivals) drawCar(ctx, rival.x, rival.y, rival.color, true);
  if (race.invulnerable <= 0 || Math.floor(race.invulnerable * 10) % 2 === 0) {
    drawCar(ctx, race.playerX, HEIGHT - 104, "#f35b55");
  }
  const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  shade.addColorStop(0, "rgba(7, 14, 29, .2)");
  shade.addColorStop(0.25, "rgba(7, 14, 29, 0)");
  shade.addColorStop(1, "rgba(7, 14, 29, .28)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (phase === "crashed") {
    ctx.fillStyle = "rgba(242, 89, 84, .15)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

export function RacingGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raceRef = useRef<Race>(newRace());
  const phaseRef = useRef<Phase>("ready");
  const controls = useRef({ left: false, right: false });
  const bestRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ score: 0, hearts: 3, overtakes: 0 });
  const [best, setBest] = useState(0);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const begin = () => {
    raceRef.current = newRace();
    controls.current.left = false;
    controls.current.right = false;
    setHud({ score: 0, hearts: 3, overtakes: 0 });
    changePhase("playing");
  };

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
      if (event.key === " " && phaseRef.current === "paused") changePhase("playing");
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
        const speed = Math.min(245 + race.distance * 0.1, 430);
        const steer = Number(controls.current.right) - Number(controls.current.left);
        race.playerX = clamp(race.playerX + steer * dt * 270, ROAD_LEFT + 34, ROAD_RIGHT - 34);
        race.distance += dt * speed / 9;
        race.invulnerable = Math.max(0, race.invulnerable - dt);
        race.spawnIn -= dt;
        if (race.spawnIn <= 0) {
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
          race.rivals.push({ x: lane, y: -55, color: Math.random() > 0.5 ? "#ffd36e" : "#75c6ee", passed: false });
          race.spawnIn = Math.max(0.62, 1.2 - race.distance / 4500) + Math.random() * 0.34;
        }
        for (const rival of race.rivals) {
          rival.y += dt * speed;
          if (!rival.passed && rival.y > HEIGHT - 65) {
            rival.passed = true;
            race.overtakes += 1;
          }
          if (race.invulnerable === 0 && Math.abs(rival.x - race.playerX) < 37 && Math.abs(rival.y - (HEIGHT - 104)) < 58) {
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
        race.rivals = race.rivals.filter((rival) => rival.y < HEIGHT + 60);
        if (time - hudTime > 120 || race.hearts <= 0) {
          setHud({ score: scoreOf(race), hearts: race.hearts, overtakes: race.overtakes });
          hudTime = time;
        }
      }
      if (ctx && (phaseRef.current === "playing" || paintedPhase !== phaseRef.current)) {
        drawTrack(ctx, race, phaseRef.current);
        paintedPhase = phaseRef.current;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [changePhase]);

  const pointCar = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "playing") return;
    const rect = event.currentTarget.getBoundingClientRect();
    raceRef.current.playerX = clamp((event.clientX - rect.left) / rect.width * WIDTH, ROAD_LEFT + 34, ROAD_RIGHT - 34);
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
        <span>REKOR <strong>{best.toLocaleString("tr-TR")}</strong></span>
      </div>
      <div className={styles.playArea}>
        <div className={styles.track}>
          <canvas
            ref={canvasRef}
            width={800}
            height={1280}
            className={styles.canvas}
            aria-label="Yukarıdan görünen yarış pisti; kırmızı arabayı sağa sola sürerek diğer arabalardan kaç"
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointCar(event); }}
            onPointerMove={(event) => { if (event.buttons || event.pointerType === "touch") pointCar(event); }}
          />
          {phase !== "playing" ? (
            <div className={styles.overlay}>
              <div className={styles.overlayCard}>
                <span className={styles.flag} aria-hidden="true">▦</span>
                <h3>{phase === "ready" ? "Işıklar sönünce başla!" : phase === "paused" ? "Pit molası" : "Yarış bitti"}</h3>
                <p>{phase === "crashed" ? `${hud.score.toLocaleString("tr-TR")} puan yaptın. Bir tur daha?` : "Trafikten kaç, rakipleri geç ve rekorunu geliştir."}</p>
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
        <p><span className={styles.desktopHint}>← → veya A / D</span><span className={styles.mobileHint}>Tuşlara basılı tut veya pistte sürükle</span><br />Rakiplere çarpmadan ilerle!</p>
        <button type="button" className={styles.steer} aria-label="Sağa sür" {...hold("right")}>▶</button>
      </footer>
    </div>
  );
}
