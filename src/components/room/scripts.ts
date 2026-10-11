/**
 * SAHNE SENARYOLARI
 * -----------------
 * Odadaki her etkileşim küçük bir "senaryo"dur: adım adım avatarı yürütür, kamerayı
 * çevirir, eşyaların durumunu değiştirir. Okunması kolay olsun diye her senaryo düz bir
 * `async` fonksiyondur; `await d.walk(...)` gibi satırlar sırayla çalışır.
 *
 * Her senaryonun bir de `finish` fonksiyonu vardır: kullanıcı "Atla" dediğinde ya da
 * hareket azaltıldığında animasyonsuz son duruma bu fonksiyon geçirir.
 */

import type { P3 } from "@/lib/iso";
import type { AvatarState } from "./avatar/model";
import { facingFor } from "./avatar/model";
import { type RecordId, RECORDS, type ShotId, SPOTS } from "./layout";
import { type Activity, DESK_ROOM, type Overlay, type RoomState, SEATED_AVATAR } from "./roomStore";
import type { RoomProps } from "./scene/RoomScene";

/** Senaryoların sahneyi yönetmek için kullandığı araçlar. */
export interface Director {
  state(): RoomState;
  wait(ms: number): Promise<void>;
  avatar(patch: Partial<AvatarState>): void;
  room(patch: Partial<RoomProps>): void;
  activity(a: Activity): void;
  /** Avatarı yol boyunca yürütür (oda birimi / saniye hızıyla). */
  walk(path: P3[], speed?: number): Promise<void>;
  /** Kamerayı bir çekime götürür; bitince çözülür. */
  camera(shot: ShotId): Promise<void>;
  /** Kamerayı anında bir çekime koyar (atlama durumunda). */
  cameraJump(shot: ShotId): void;
  /** Kamerayı kaydırma turuna geri verir. */
  releaseCamera(): Promise<void>;
  status(text: string): void;
  say(text: string): void;
  open(overlay: Overlay): void;
}

export interface Script {
  id: string;
  /** Kullanıcı başka bir şeye tıklarsa bu senaryo hemen bitirilebilir mi? */
  interruptible?: boolean;
  /** Senaryo kamerayı hiç oynatmıyorsa true (ör. kendi kendine şekerleme) */
  keepCamera?: boolean;
  /** Küçük, kendiliğinden hareketler: arayüzü "sahne oynuyor" durumuna sokmaz. */
  quiet?: boolean;
  run(d: Director): Promise<void>;
  finish(d: Director): void;
}

export const WALK_SPEED = 6.4;

/* ---------- Ortak adımlar ---------- */

async function standUp(d: Director) {
  d.room({ chairRolled: true, chairLayer: "front" });
  d.avatar({ pose: "stand", pos: SPOTS.stand, facing: "-y", headFacing: undefined, moveMs: 0 });
  await d.wait(360);
}

async function sitDown(d: Director) {
  d.avatar({ pose: "stand", facing: "-y" });
  await d.wait(120);
  d.room({ chairRolled: false, chairLayer: "backrest" });
  d.avatar({ pose: "sit", pos: SPOTS.seat, moveMs: 0 });
  await d.wait(380);
  d.avatar({ pose: "type" });
}

/** Avatar ayaktaysa masaya yürür ve oturur. */
async function walkBackAndSit(d: Director, from: "left" | "right") {
  const side = from === "left" ? SPOTS.deskLeft : SPOTS.deskRight;
  await d.walk([side]);
  d.room({ chairLayer: "front" });
  await d.walk([SPOTS.stand]);
  await sitDown(d);
}

/** Oyunu bırakır: TV'de yarış ön izlemesi kalır, kulaklık ve kumanda sehpaya döner. */
async function leaveGaming(d: Director) {
  d.room({ tv: "chill", headphonesOnTable: true, controllerOnTable: true });
  d.avatar({ pose: "stand", pos: SPOTS.beanSide, facing: "+x", headphones: false, moveMs: 0 });
  await d.wait(260);
}

/** Uyanır: avatar yatağın ayak ucunda gerinerek kalkar. */
async function leaveBed(d: Director) {
  d.room({ sleeping: false });
  d.avatar({ pose: "stretch", pos: SPOTS.bedFoot, facing: "+y", moveMs: 0 });
  await d.wait(700);
}

/** Avatarı nerede olursa olsun masasına döndürür (oyun, uyku...). */
export async function returnToDesk(d: Director) {
  const s = d.state();
  if (s.activity === "gaming") {
    d.status("Avatar oyunu bırakıp masasına dönüyor");
    await leaveGaming(d);
    await d.walk([SPOTS.beanAisle, SPOTS.aisleRight]);
    await walkBackAndSit(d, "right");
    d.activity("desk");
    return;
  }
  if (s.activity === "sleeping") {
    d.status("Avatar uyanıp masasına dönüyor");
    await leaveBed(d);
    await d.walk([SPOTS.bedFront, SPOTS.bedAisle, SPOTS.aisleRight]);
    await walkBackAndSit(d, "right");
    d.activity("desk");
    return;
  }
  const { avatar } = s;
  const seated = avatar.pos[2] > 1 && avatar.pose !== "lounge";
  if (!seated) {
    // Beklenmedik bir yerde kaldıysa (ör. atlanan bir senaryodan sonra) en yakın yoldan döner.
    await walkBackAndSit(d, avatar.pos[0] < SPOTS.stand[0] ? "left" : "right");
  }
  d.avatar({ headFacing: undefined, holding: null });
}

/** Takılı plağa göre ana monitörde ne görüneceği. */
const screenFor = (record: RecordId | null): RoomProps["mainScreen"] => record ?? "saver";

/** Plağa göre açılacak tam ekran: CV ekranı ya da proje masaüstü. */
const overlayFor = (record: RecordId): Overlay => (record === "cv" ? { kind: "cv" } : { kind: "desktop" });

/** Plak, ışık gibi kalıcı oda durumunu koruyarak masadaki varsayılan durum. */
function keptRoom(s: RoomState): RoomProps {
  return {
    ...DESK_ROOM,
    takenRecord: s.room.takenRecord,
    loadedRecord: s.room.loadedRecord,
    mainScreen: screenFor(s.room.loadedRecord),
    lights: s.room.lights,
  };
}

/** Odayı animasyonsuz "masada oturuyor" durumuna getirir. */
function deskState(d: Director, room: Partial<RoomProps> = {}) {
  d.room({ ...keptRoom(d.state()), ...room });
  d.avatar({ ...SEATED_AVATAR });
  d.activity("desk");
}

/* ---------- Plak duvarı ---------- */

/**
 * Tablodaki plağa tıklanınca: avatar kalkar, tabloya gider, plağı alır, bilgisayar
 * kasasına takar, masasına döner; ana monitör büyüyüp CV ekranına ya da proje
 * masaüstüne dönüşür. Kasada başka bir plak varsa avatar önce onu çıkarıp kendi
 * tablosuna geri asar. Plak zaten takılıysa avatar yeniden yürümez.
 */
export function recordScript(record: RecordId): Script {
  const { label, stand } = RECORDS[record];
  const name = record === "cv" ? "CV" : "Projeler";
  return {
    id: `record:${record}`,
    async run(d) {
      await returnToDesk(d);
      if (d.state().room.loadedRecord === record) {
        d.status(`${name} plağı zaten bilgisayarda, ekran açılıyor`);
        d.room({ mainScreen: record });
        await d.camera("mainMonitor");
        d.open(overlayFor(record));
        return;
      }

      const previous = d.state().room.loadedRecord;
      d.status(`Avatar ${name} plağını almaya gidiyor`);
      const cam = d.camera("recordAction");
      await standUp(d);
      await d.walk([SPOTS.deskLeft]);
      d.room({ chairLayer: "behind" });

      if (previous) {
        // Takılı plak önce kasadan çıkarılır ve kendi tablosuna geri asılır.
        d.status(`${RECORDS[previous].label} plağı yerine asılıyor`);
        await d.walk([SPOTS.pc]);
        d.avatar({ pose: "crouch", facing: "-y" });
        await d.wait(380);
        d.room({ loadedRecord: null, mainScreen: "saver" });
        d.avatar({ holding: previous, pose: "carry" });
        await d.wait(220);
        await d.walk([
          [SPOTS.deskLeft[0], SPOTS.pc[1], 0],
          [SPOTS.deskLeft[0], RECORDS[previous].stand[1], 0],
        ]);
        d.avatar({ pose: "reach", facing: "-x" });
        await d.wait(420);
        d.room({ takenRecord: null });
        d.avatar({ holding: null, pose: "stand" });
        await d.wait(200);
        d.status(`Avatar ${name} plağını almaya gidiyor`);
      }

      await d.walk([[SPOTS.deskLeft[0], stand[1], 0]]);
      d.avatar({ pose: "reach", facing: "-x" });
      await d.wait(480);
      d.room({ takenRecord: record });
      d.avatar({ holding: record, pose: "carry" });
      await d.wait(240);
      await cam;

      d.status(`${label} plağı bilgisayara takılıyor`);
      await d.walk([SPOTS.deskLeft, SPOTS.pc]);
      d.avatar({ pose: "crouch", facing: "-y" });
      await d.wait(420);
      d.room({ loadedRecord: record, mainScreen: "boot" });
      await d.wait(380);
      d.avatar({ pose: "carry" });

      d.room({ chairLayer: "front" });
      await d.walk([SPOTS.stand]);
      await sitDown(d);
      d.avatar({ holding: null, pose: "mouse" });
      d.room({ mainScreen: record });
      d.status(record === "cv" ? "Özgeçmiş açılıyor" : "Proje masaüstü açılıyor");
      await d.camera("mainMonitor");
      await d.wait(200);
      d.avatar({ pose: "type" });
      d.open(overlayFor(record));
    },
    finish(d) {
      deskState(d, { takenRecord: record, loadedRecord: record, mainScreen: record });
      d.cameraJump("mainMonitor");
      d.open(overlayFor(record));
    },
  };
}

/** Ana monitöre tıklanınca: takılı plak varsa ekranını açar, yoksa avatar ipucu verir. */
export function mainMonitorScript(loaded: RecordId | null): Script {
  if (!loaded) {
    return {
      id: "main-monitor-hint",
      interruptible: true,
      keepCamera: true,
      quiet: true,
      async run(d) {
        const hint = "Önce duvardaki plaklardan birini seçelim!";
        if (d.state().activity !== "desk") {
          d.say(hint);
          return;
        }
        d.avatar({ headFacing: "+y", pose: "sit" });
        d.say(hint);
        await d.wait(1900);
        d.avatar({ headFacing: undefined, pose: "type" });
      },
      finish(d) {
        if (d.state().activity === "desk") d.avatar({ headFacing: undefined, pose: "type" });
      },
    };
  }
  return {
    id: "main-monitor",
    async run(d) {
      await returnToDesk(d);
      d.room({ mainScreen: loaded });
      await d.camera("mainMonitor");
      d.open(overlayFor(loaded));
    },
    finish(d) {
      deskState(d);
      d.cameraJump("mainMonitor");
      d.open(overlayFor(loaded));
    },
  };
}

/* ---------- Mola köşesi ---------- */

/**
 * Pufa / televizyona tıklanınca. Avatar zaten oyun oynuyorsa pufa tıklamak molayı bitirir.
 * `current`: senaryo oluşturulduğu andaki uğraş.
 */
export function chillScript(current: Activity): Script {
  if (current === "gaming") {
    return {
      id: "chill-stop",
      async run(d) {
        await returnToDesk(d);
        d.status("Mola bitti, avatar masasında");
        await d.releaseCamera();
      },
      finish(d) {
        deskState(d);
        void d.releaseCamera();
      },
    };
  }
  return {
    id: "chill",
    async run(d) {
      d.status("Avatar mola köşesine geçiyor");
      const cam = d.camera("tvAction");
      if (d.state().activity === "sleeping") {
        // Yataktan doğrudan pufa: masaya uğramaz.
        await leaveBed(d);
        await d.walk([SPOTS.bedFront, [SPOTS.bedFront[0], SPOTS.beanSide[1], 0], SPOTS.beanSide]);
      } else {
        await returnToDesk(d);
        await standUp(d);
        await d.walk([SPOTS.deskRight]);
        d.room({ chairLayer: "behind" });
        await d.walk([SPOTS.aisleRight, SPOTS.beanAisle, SPOTS.beanSide]);
      }
      await cam;
      d.avatar({ pose: "stand", facing: "-x" });
      await d.wait(160);
      d.room({ controllerOnTable: false });
      d.avatar({ pose: "lounge", pos: SPOTS.beanSeat, facing: "-x", moveMs: 0 });
      await d.wait(520);
      d.status("Kulaklık takıldı, televizyon açılıyor");
      d.room({ headphonesOnTable: false });
      d.avatar({ headphones: true });
      await d.wait(380);
      d.room({ tv: "boot" });
      await d.wait(1400);
      d.room({ tv: "chill" });
      d.activity("gaming");
      d.status("Yarış başlıyor!");
      d.open({ kind: "game" });
    },
    finish(d) {
      const s = d.state();
      d.room({
        ...keptRoom(s),
        chairRolled: true,
        chairLayer: "behind",
        tv: "chill",
        headphonesOnTable: false,
        controllerOnTable: false,
      });
      d.avatar({ ...SEATED_AVATAR, pose: "lounge", pos: SPOTS.beanSeat, facing: "-x", headphones: true });
      d.activity("gaming");
      d.status("Yarış başlıyor!");
      d.cameraJump("tvAction");
      d.open({ kind: "game" });
    },
  };
}

/** Avatar pufundayken TV'ye tekrar basılırsa yarış ekranı yeniden açılır. */
export function resumeGameScript(): Script {
  return {
    id: "resume-game",
    async run(d) {
      await d.camera("tvAction");
      d.open({ kind: "game" });
    },
    finish(d) {
      d.cameraJump("tvAction");
      d.open({ kind: "game" });
    },
  };
}

/* ---------- Yatak köşesi ---------- */

/**
 * Yatağa tıklanınca kısa şekerleme. Avatar zaten uyuyorsa uyanıp masasına döner.
 * `auto: true` → kullanıcı uzun süre bir şey yapmayınca kendiliğinden, kamerayı oynatmadan.
 */
export function restScript(current: Activity, options: { auto?: boolean } = {}): Script {
  const auto = options.auto ?? false;
  if (current === "sleeping") return wakeScript();
  return {
    id: auto ? "idle-rest" : "rest",
    interruptible: auto,
    keepCamera: auto,
    quiet: auto,
    async run(d) {
      if (!auto) d.status("Avatar kısa bir şekerlemeye gidiyor");
      const cam = auto ? Promise.resolve() : d.camera("bedAction");
      if (d.state().activity === "gaming") {
        // Puftan doğrudan yatağa: masaya uğramaz.
        await leaveGaming(d);
        await d.walk([[SPOTS.bedFront[0], SPOTS.beanSide[1], 0], SPOTS.bedFront, SPOTS.bedFoot]);
      } else {
        await returnToDesk(d);
        await standUp(d);
        await d.walk([SPOTS.deskRight]);
        d.room({ chairLayer: "behind" });
        await d.walk([SPOTS.aisleRight, SPOTS.bedAisle, SPOTS.bedFront, SPOTS.bedFoot]);
      }
      await cam;
      d.avatar({ pose: "stand", facing: "-y" });
      await d.wait(220);
      d.avatar({ pose: "hidden" });
      d.room({ sleeping: true });
      d.activity("sleeping");
      if (auto) {
        await d.wait(6000);
        await returnToDesk(d);
        return;
      }
      d.status("Avatar uyuyor. Birazdan kendiliğinden uyanacak.");
    },
    finish(d) {
      if (auto) {
        deskState(d);
        return;
      }
      const s = d.state();
      d.room({
        ...keptRoom(s),
        chairRolled: true,
        chairLayer: "behind",
        sleeping: true,
      });
      d.avatar({ ...SEATED_AVATAR, pose: "hidden", pos: SPOTS.bedFoot });
      d.activity("sleeping");
      d.status("Avatar uyuyor. Birazdan kendiliğinden uyanacak.");
      d.cameraJump("bedAction");
    },
  };
}

/** Uyuyan avatarı uyandırıp masasına döndürür. */
export function wakeScript(): Script {
  return {
    id: "wake",
    interruptible: true,
    async run(d) {
      await returnToDesk(d);
      d.status("Avatar masasında");
      await d.releaseCamera();
    },
    finish(d) {
      deskState(d);
      void d.releaseCamera();
    },
  };
}

/* ---------- Gizli dikey monitör ---------- */

export function loginScript(): Script {
  return {
    id: "login",
    async run(d) {
      await returnToDesk(d);
      d.status("Dikey monitörde bir şey var…");
      const cam = d.camera("verticalMonitor");
      d.avatar({ pose: "mouse", headFacing: "+x" });
      d.room({ verticalScreen: "cursor" });
      await cam;
      await d.wait(900);
      d.status("Kişisel alan girişi açılıyor");
      d.open({ kind: "login" });
      d.avatar({ pose: "type", headFacing: undefined });
    },
    finish(d) {
      deskState(d, { verticalScreen: "cursor" });
      d.cameraJump("verticalMonitor");
      d.open({ kind: "login" });
    },
  };
}

/* ---------- Avatarla selamlaşma ve boştayken küçük hareketler ---------- */

export function greetScript(): Script {
  return {
    id: "greet",
    interruptible: true,
    keepCamera: true,
    quiet: true,
    async run(d) {
      d.avatar({ pose: "wave", headFacing: "+y" });
      d.say("Selam! Odama hoş geldin. Duvardaki plaklara bir göz at.");
      await d.wait(2200);
      d.avatar({ pose: "type", headFacing: undefined });
    },
    finish(d) {
      d.avatar({ pose: "type", headFacing: undefined });
    },
  };
}

type IdleKind = "peek" | "glance" | "stretch" | "pause";

export function idleScript(kind: IdleKind): Script {
  return {
    id: `idle-${kind}`,
    interruptible: true,
    keepCamera: true,
    quiet: true,
    async run(d) {
      if (kind === "peek") d.avatar({ pose: "sit", headFacing: "+y" });
      if (kind === "glance") d.avatar({ pose: "sit", headFacing: "+x" });
      if (kind === "stretch") d.avatar({ pose: "stretch" });
      if (kind === "pause") d.avatar({ pose: "sit" });
      await d.wait(kind === "pause" ? 2600 : 1900);
      d.avatar({ pose: "type", headFacing: undefined });
    },
    finish(d) {
      d.avatar({ pose: "type", headFacing: undefined });
    },
  };
}

/* ---------- Yardımcı: yürüme süresi ---------- */

export function walkSegments(from: P3, path: P3[], speed = WALK_SPEED) {
  const segments: { to: P3; ms: number; facing: AvatarState["facing"] }[] = [];
  let current = from;
  for (const to of path) {
    const dist = Math.hypot(to[0] - current[0], to[1] - current[1]);
    if (dist > 0.01) segments.push({ to, ms: (dist / speed) * 1000, facing: facingFor(current, to) });
    current = to;
  }
  return segments;
}
