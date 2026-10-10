import { memo } from "react";
import { IsoBox, IsoCylinder, IsoFace } from "@/components/iso/Iso";
import { box, iso, material } from "@/lib/iso";
import type { Project } from "@/data/projects";
import { caseCover, SHELF_SLOTS, SHELVES, type ShelfSlot } from "../layout";
import { C, M } from "./palette";
import styles from "./Scene.module.css";

interface ShelvesProps {
  /** Raf yuvalarına sırayla yerleşen projeler */
  projects: Project[];
  /** Şu an avatarın elinde ya da bilgisayarda olan kutu (rafta görünmez) */
  takenId: string | null;
  /** Fareyle üstüne gelinen ya da klavyeyle odaklanılan nesne */
  hotId: string | null;
}

export const Shelves = memo(function Shelves({ projects, takenId, hotId }: ShelvesProps) {
  const [b0, b1] = SHELVES.boards;
  return (
    <g>
      <Brackets />
      <IsoBox b={b0} m={M.wood} edge="rgba(255,255,255,0.6)" />
      <IsoBox b={b1} m={M.wood} edge="rgba(255,255,255,0.6)" />

      {/* Alt raf: saksı + sarkan sarmaşık */}
      <ShelfPlant />
      {/* Üst raf: kitaplar */}
      <Books />

      {SHELF_SLOTS.map((slot, i) => {
        const project = projects[i];
        if (!project) return <EmptySlotMark key={slot.case.y + slot.case.z} slot={slot} />;
        return (
          <ProjectCase
            key={project.id}
            slot={slot}
            project={project}
            index={i}
            taken={takenId === project.id}
            hot={hotId === `project:${project.id}`}
          />
        );
      })}
    </g>
  );
});

function Brackets() {
  return (
    <g>
      {SHELVES.boards.flatMap((b) =>
        [b.y + 0.5, b.y + b.d - 0.8].map((y) => (
          <IsoBox key={`${b.z}-${y}`} b={box(0, y, b.z - 0.55, 0.9, 0.22, 0.55)} m={M.woodDark} />
        )),
      )}
    </g>
  );
}

interface CaseProps {
  slot: ShelfSlot;
  project: Project;
  index: number;
  taken: boolean;
  hot: boolean;
}

/** Raftaki proje kutusu: kapağı odaya bakar, içindeki disk üstten görünür. */
function ProjectCase({ slot, project, index, taken, hot }: CaseProps) {
  const cover = caseCover(slot.case);
  const placeholder = project.status === "placeholder";
  const m = material(project.accent, 0.35, 0.18);
  const discAt = cover.at;
  const w = cover.w * 100;
  const h = cover.h * 100;
  return (
    <g className={styles.case} data-taken={taken} data-hot={hot}>
      {/* Disk: kutunun arkasından taşar, üstüne gelince yükselir */}
      <IsoFace plane="x" at={[discAt[0] - 0.12, discAt[1], discAt[2]]}>
        <g className={styles.disc}>
          <circle cx={w / 2} cy={14} r={w * 0.36} fill="url(#rm-disc)" stroke="#cfd3e6" strokeWidth={2} />
          <circle cx={w / 2} cy={14} r={w * 0.13} fill={project.accent} />
          <circle cx={w / 2} cy={14} r={5} fill="#f4f2fa" />
        </g>
      </IsoFace>
      <IsoBox b={slot.case} m={m} />
      <IsoFace plane="x" at={cover.at}>
        <rect width={w} height={h} rx={6} fill={placeholder ? "#fbf8f4" : project.accent} />
        {placeholder ? (
          <g>
            <rect
              x={14}
              y={14}
              width={w - 28}
              height={h - 28}
              rx={8}
              fill="none"
              stroke={project.accent}
              strokeWidth={5}
              strokeDasharray="14 10"
            />
            <text x={w / 2} y={h * 0.55} textAnchor="middle" className={styles.coverMark} fill={project.accent}>
              ?
            </text>
            <text x={w / 2} y={h - 30} textAnchor="middle" className={styles.coverText} fill="#8d8299">
              BOŞ SLOT
            </text>
          </g>
        ) : (
          <g>
            <rect x={0} y={0} width={w} height={h * 0.62} rx={6} fill={project.accent2} opacity={0.35} />
            <path d={`M${w * 0.5},${h * 0.16} L${w * 0.78},${h * 0.62} H${w * 0.64} L${w * 0.5},${h * 0.37} L${w * 0.36},${h * 0.62} H${w * 0.22} Z`} fill="#ffffff" />
            <rect x={w * 0.42} y={h * 0.5} width={w * 0.16} height={h * 0.06} fill="#ffffff" />
            <text x={w / 2} y={h - 30} textAnchor="middle" className={styles.coverText} fill="#ffffff">
              {project.title.toUpperCase()}
            </text>
          </g>
        )}
        <text x={14} y={30} className={styles.coverIndex} fill={placeholder ? "#b3a9bd" : "#ffffffcc"}>
          {String(index + 1).padStart(2, "0")}
        </text>
      </IsoFace>
    </g>
  );
}

function EmptySlotMark({ slot }: { slot: ShelfSlot }) {
  const cover = caseCover(slot.case);
  return (
    <IsoFace plane="x" at={[cover.at[0] - 0.25, cover.at[1], cover.at[2]]}>
      <rect width={cover.w * 100} height={cover.h * 100} rx={8} fill="none" stroke="#d9cfc6" strokeWidth={3} strokeDasharray="8 8" />
    </IsoFace>
  );
}

function ShelfPlant() {
  const board = SHELVES.boards[0];
  const top = board.z + board.h;
  const c = [0.75, 8.85, top] as const;
  const [x, y] = iso(c[0], c[1], top + 0.9);
  return (
    <g>
      <IsoCylinder c={c} r={0.48} h={0.9} side={M.terracotta.left} top="#6d4a3a" />
      <g transform={`translate(${x} ${y})`}>
        <g className={`${styles.vine} ${styles.ambient}`}>
          <path d="M-6,0 C-14,22 -4,40 -12,70 M4,0 C10,26 2,48 8,88" stroke={C.leafDark} strokeWidth={2} fill="none" />
          {[10, 26, 44, 62].map((v, i) => (
            <ellipse key={v} cx={i % 2 ? 8 : -12} cy={v} rx={6} ry={4} fill={i % 2 ? C.leaf : C.leafDark} transform={`rotate(${i % 2 ? 30 : -30} ${i % 2 ? 8 : -12} ${v})`} />
          ))}
          <ellipse cx={4} cy={80} rx={6} ry={4} fill={C.leaf} />
          <ellipse cx={-2} cy={-6} rx={12} ry={7} fill={C.leaf} />
          <ellipse cx={8} cy={-10} rx={8} ry={6} fill={C.leafDark} />
        </g>
      </g>
    </g>
  );
}

const BOOK_COLORS = ["#f59f84", "#8b7cf6", "#ffe29a", "#7fd0ad", "#a9d4fb", "#f7b6c8"];

function Books() {
  const board = SHELVES.boards[1];
  const top = board.z + board.h;
  let y = 8.12;
  return (
    <g>
      {BOOK_COLORS.slice(0, 5).map((color, i) => {
        const thick = 0.2 + (i % 3) * 0.05;
        const h = 1.35 + ((i * 37) % 5) * 0.12;
        const b = box(0.1, y, top, 1.1, thick, h);
        y += thick + 0.02;
        return <IsoBox key={color} b={b} m={material(color, 0.3, 0.16)} />;
      })}
    </g>
  );
}
