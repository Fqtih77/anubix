import { type CSSProperties, memo } from "react";
import type { Project } from "@/data/projects";
import { iso } from "@/lib/iso";
import { Avatar } from "../avatar/Avatar";
import type { AvatarState } from "../avatar/model";
import { ROOM, SCENE } from "../layout";
import { BedCorner, BedRug, LightShaft } from "./BedCorner";
import { ChairPart, Desk, PcCase } from "./DeskSetup";
import styles from "./Scene.module.css";
import type { MainScreenState, TvState, VerticalScreenState } from "./Screens";
import { Shelves } from "./Shelves";
import { Curtains, Shell, StringLights, Window } from "./Shell";
import { Rugs, TvFurniture, TvWall } from "./TvCorner";
import { WallDecor } from "./WallDecor";

// Yürüyüşte avatar sık güncellenir; diğer SVG katmanları prop değişmedikçe aynı kalır.
const StableShelves = memo(Shelves);
const StableTvWall = memo(TvWall);
const StablePcCase = memo(PcCase);
const StableDesk = memo(Desk);
const StableChairPart = memo(ChairPart);
const StableBedCorner = memo(BedCorner);
const StableTvFurniture = memo(TvFurniture);

/** Odadaki değişebilen her şeyin durumu. Senaryolar (scripts.ts) bunu günceller. */
export interface RoomProps {
  /** Sandalye geri kaydı mı (avatar ayakta) */
  chairRolled: boolean;
  /**
   * Sandalyenin avatara göre çizim katmanı:
   * "behind" → sandalye avatarın arkasında, "backrest" → yalnız sırtlık önde (oturuyor),
   * "front" → bütün sandalye önde (avatar sandalyenin arkasından geçiyor).
   */
  chairLayer: "behind" | "backrest" | "front";
  /** Raftan alınmış kutu */
  takenProject: string | null;
  /** Bilgisayara takılı proje */
  loadedProject: string | null;
  mainScreen: MainScreenState;
  verticalScreen: VerticalScreenState;
  tv: TvState;
  headphonesOnTable: boolean;
  controllerOnTable: boolean;
  sleeping: boolean;
}

export type IntroPhase = "pending" | "playing" | "done";

interface RoomSceneProps {
  room: RoomProps;
  avatar: AvatarState;
  projects: Project[];
  intro: IntroPhase;
  /** Arka plan hareketlerini durdur (bir eyleme odaklanınca) */
  calm: boolean;
  hotId: string | null;
}

function RoomSceneImpl({ room, avatar, projects, intro, calm, hotId }: RoomSceneProps) {
  const loaded = projects.find((p) => p.id === room.loadedProject) ?? null;
  const held = projects.find((p) => p.id === avatar.holding) ?? null;
  const seatedLayer = room.chairLayer;
  const sceneStyle = { "--pc-glow": loaded?.accent ?? "#9d8cff" } as CSSProperties;

  return (
    <svg
      className={styles.scene}
      width={SCENE.width}
      height={SCENE.height}
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      data-intro={intro}
      data-calm={calm}
      style={sceneStyle}
      aria-hidden="true"
      focusable="false"
    >
      <SceneDefs />
      <g transform={`translate(${SCENE.originX} ${SCENE.originY})`}>
        <StaticRoom />
        <StableShelves projects={projects} takenId={room.takenProject} hotId={hotId} />
        <StableTvWall tv={room.tv} hot={hotId === "tv"} />

        {/* Zemindeki mobilyalar: arkadan öne */}
        <StablePcCase loaded={loaded} />
        <StableDesk
          mainScreen={room.mainScreen}
          verticalScreen={room.verticalScreen}
          loaded={loaded}
          deskCase={loaded && avatar.holding !== loaded.id ? loaded : null}
          hotId={hotId}
        />
        <StableChairPart part="base" rolled={room.chairRolled} hidden={seatedLayer === "front"} />
        <StableChairPart part="backrest" rolled={room.chairRolled} hidden={seatedLayer !== "behind"} />
        <StableBedCorner sleeping={room.sleeping} hot={hotId === "bed"} />
        <StaticLight />
        <StableTvFurniture
          headphonesOnTable={room.headphonesOnTable}
          controllerOnTable={room.controllerOnTable}
          beanOccupied={avatar.pose === "lounge"}
          tvOn={room.tv !== "off"}
          hotId={hotId}
        />

        <Avatar state={avatar} caseColor={held?.accent} />

        {/* Avatarın önünde kalması gereken sandalye parçaları */}
        <StableChairPart part="base" rolled={room.chairRolled} hidden={seatedLayer !== "front"} />
        <StableChairPart part="backrest" rolled={room.chairRolled} hidden={seatedLayer === "behind"} />
      </g>
    </svg>
  );
}

export const RoomScene = memo(RoomSceneImpl);

/** Avatar ve hotspot güncellemelerinde sabit SVG geometrisini yeniden çizme. */
const StaticRoom = memo(function StaticRoom() {
  return <>
    <GroundShadow />
    <Shell />
    <Rugs />
    <BedRug />
    <Window />
    <Curtains />
    <WallDecor />
    <StringLights />
  </>;
});
const StaticLight = memo(LightShaft);

/** Maketin altına düşen yumuşak gölge. */
function GroundShadow() {
  const [cx, cy] = iso(ROOM.w / 2, ROOM.d / 2, -ROOM.floor);
  const rx = (ROOM.w + ROOM.d) * 0.5 * 27.7;
  return <ellipse cx={cx} cy={cy + 40} rx={rx} ry={rx * 0.42} fill="url(#rm-ground)" />;
}

/* ---------- Gradyanlar ve filtreler ---------- */

/** Köşe gölgesi şeridinin ekrandaki genişliği (sol duvarda y: 0 → 1.6). */
const CORNER_AO_X = iso(0, 1.6)[0];

const SceneDefs = memo(function SceneDefs() {
  // Duvar diplerindeki gölge gradyanları: şeridin kenarlarına dik yönde.
  const n = 38.8;
  const [shaftX1, shaftY1] = iso(18, 0, 10);
  const [shaftX2, shaftY2] = iso(17, 8.5, 2.5);
  return (
    <defs>
      <linearGradient id="rm-wall-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f5eeea" />
        <stop offset="1" stopColor="#ede4df" />
      </linearGradient>
      <linearGradient id="rm-wall-right" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fefbf8" />
        <stop offset="1" stopColor="#f7f0ea" />
      </linearGradient>
      <linearGradient id="rm-ao-right" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={-n / 2} y2={n * 0.866}>
        <stop offset="0" stopColor="#7a5b3f" stopOpacity="0.16" />
        <stop offset="1" stopColor="#7a5b3f" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-ao-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={n / 2} y2={n * 0.866}>
        <stop offset="0" stopColor="#7a5b3f" stopOpacity="0.16" />
        <stop offset="1" stopColor="#7a5b3f" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-ao-corner" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={CORNER_AO_X} y2="0">
        <stop offset="0" stopColor="#5b4a6b" stopOpacity="0.1" />
        <stop offset="1" stopColor="#5b4a6b" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className={styles.skyTop} />
        <stop offset="1" className={styles.skyBottom} />
      </linearGradient>
      <radialGradient id="rm-bulb-glow">
        <stop offset="0" stopColor="#ffe6a1" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffe6a1" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rm-backglow">
        <stop offset="0" stopColor="#b9a8f6" stopOpacity="0.55" />
        <stop offset="0.6" stopColor="#a9d4fb" stopOpacity="0.18" />
        <stop offset="1" stopColor="#a9d4fb" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rm-glare" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="0.46" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fffbea" stopOpacity="0.22" />
        <stop offset="1" stopColor="#fffbea" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-mug" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffd2bf" />
        <stop offset="1" stopColor="#f2a588" />
      </linearGradient>
      <radialGradient id="rm-pc-inner" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" className={styles.pcGlowStop} stopOpacity="0.55" />
        <stop offset="1" className={styles.pcGlowStop} stopOpacity="0.08" />
      </radialGradient>
      <radialGradient id="rm-disc" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#e2e6f6" />
        <stop offset="0.75" stopColor="#f6e4f3" />
        <stop offset="1" stopColor="#d5dcf0" />
      </radialGradient>
      <linearGradient id="rm-saver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9d8cf7" />
        <stop offset="1" stopColor="#7cc0f2" />
      </linearGradient>
      <linearGradient id="rm-screen-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id="rm-tv-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8f7ff0" />
        <stop offset="0.55" stopColor="#f6a6b7" />
        <stop offset="1" stopColor="#ffd3a1" />
      </linearGradient>
      <linearGradient id="rm-bean" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c8bdfb" />
        <stop offset="1" stopColor="#a594ef" />
      </linearGradient>
      <radialGradient id="rm-lamp-glow">
        <stop offset="0" stopColor="#ffd98f" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd98f" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rm-pot" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e5ddf0" />
      </linearGradient>
      <linearGradient id="rm-shaft" gradientUnits="userSpaceOnUse" x1={shaftX1} y1={shaftY1} x2={shaftX2} y2={shaftY2}>
        <stop offset="0" stopColor="#fff4d6" stopOpacity="0.42" />
        <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rm-poster-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b9a8f6" />
        <stop offset="1" stopColor="#ffd2be" />
      </linearGradient>
      <radialGradient id="rm-ground">
        <stop offset="0" stopColor="#5b4a8a" stopOpacity="0.28" />
        <stop offset="0.7" stopColor="#5b4a8a" stopOpacity="0.08" />
        <stop offset="1" stopColor="#5b4a8a" stopOpacity="0" />
      </radialGradient>
      <filter id="rm-neon" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
});
