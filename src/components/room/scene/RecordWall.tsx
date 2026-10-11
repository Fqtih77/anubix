import { memo } from "react";
import { IsoBox, IsoFace } from "@/components/iso/Iso";
import { box, type Material } from "@/lib/iso";
import { frameFace, RECORD_IDS, type RecordFrame, type RecordId, RECORDS } from "../layout";
import styles from "./Scene.module.css";

/**
 * Plak duvarı: sol duvarda iki tablo, her birinde bir plak.
 * Avatar plağı alınca tabloda boş bir halka kalır; plak bilgisayardan çıkınca geri döner.
 */

const FRAME_MAT: Material = { top: "#f1dcbd", left: "#d9b48a", right: "#c59a6f" };
const BRASS: Material = { top: "#f6dd9a", left: "#d9b55e", right: "#b8913f" };

interface Props {
  /** Tablosundan alınmış plak (elde ya da bilgisayarda) */
  taken: RecordId | null;
  hotId: string | null;
}

export const RecordWall = memo(function RecordWall({ taken, hotId }: Props) {
  return (
    <g>
      {RECORD_IDS.map((id) => (
        <FrameArt key={id} record={RECORDS[id]} taken={taken === id} hot={hotId === `record:${id}`} />
      ))}
    </g>
  );
});

function FrameArt({ record, taken, hot }: { record: RecordFrame; taken: boolean; hot: boolean }) {
  const b = record.frame;
  const face = frameFace(b);
  const isCv = record.id === "cv";
  // Tablonun üstündeki küçük pirinç tablo lambası
  const lamp = box(0, b.y + b.d / 2 - 0.55, b.z + b.h + 0.16, 0.48, 1.1, 0.13);
  const arm = box(0, b.y + b.d / 2 - 0.06, b.z + b.h + 0.05, 0.3, 0.12, 0.2);
  return (
    <g className={styles.recordFrame} data-hot={hot} data-taken={taken}>
      <IsoBox b={b} m={FRAME_MAT} edge="rgba(255,255,255,0.7)" />
      <IsoFace plane="x" at={face.at}>
        <rect x={16} y={16} width={248} height={248} fill={isCv ? "#e6edff" : "#efe9ff"} />
        <rect x={16} y={16} width={248} height={248} fill="none" stroke="#c9a77f" strokeWidth={4} />

        {/* Plak kapağı: plağın arkasında durur */}
        <rect x={40} y={50} width={140} height={140} rx={4} fill={record.color} />
        {isCv ? <CvSleeve /> : <ProjectsSleeve />}

        {/* Plak yerindeyken görünür; alınınca boş halka kalır */}
        <circle className={styles.vinylGhost} cx={176} cy={122} r={66} />
        <g className={styles.vinyl}>
          <g className={styles.vinylSpin}>
            <circle cx={176} cy={122} r={66} fill="#1d1a29" />
            {[58, 50, 42, 34].map((r) => (
              <circle key={r} cx={176} cy={122} r={r} fill="none" stroke="#35314b" strokeWidth={1.6} />
            ))}
            <path d="M136,86 A56,56 0 0 1 204,74" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={7} fill="none" />
            <circle cx={176} cy={122} r={23} fill={record.color} />
            <circle cx={176} cy={122} r={23} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} />
            <text x={176} y={129} textAnchor="middle" className={styles.vinylLabel}>
              {isCv ? "CV" : "A"}
            </text>
            <circle cx={176} cy={122} r={3} fill="#f4f2fa" />
          </g>
        </g>

        <text x={140} y={243} textAnchor="middle" className={styles.frameLabel}>
          {record.label}
        </text>
      </IsoFace>
      <IsoBox b={arm} m={BRASS} />
      <IsoBox b={lamp} m={BRASS} soft={1.5} />
    </g>
  );
}

/** CV plağının kapağı: küçük bir sayfa çizimi. */
function CvSleeve() {
  return (
    <g>
      <rect x={62} y={66} width={76} height={100} rx={3} fill="#ffffff" />
      <rect x={72} y={76} width={56} height={8} rx={2} fill="#2563eb" />
      {[94, 104, 114, 124, 134, 144, 154].map((y, i) => (
        <rect key={y} x={72} y={y} width={i % 3 === 0 ? 30 : 56} height={4} rx={2} fill={i % 3 === 0 ? "#2563eb" : "#c9d6f2"} />
      ))}
    </g>
  );
}

/** Projeler plağının kapağı: küçük klasörler. */
function ProjectsSleeve() {
  return (
    <g>
      {[
        [58, 72, "#ffd36e"],
        [100, 72, "#7fd0ad"],
        [58, 120, "#f29f86"],
        [100, 120, "#a9d4fb"],
      ].map(([x, y, c]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path d="M0,6 h12 l4,-6 h16 v34 h-32 Z" fill={c as string} />
          <rect x={0} y={8} width={32} height={26} rx={2} fill={c as string} />
          <rect x={0} y={8} width={32} height={8} fill="#ffffff" opacity={0.35} />
        </g>
      ))}
    </g>
  );
}
