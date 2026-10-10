import { type CSSProperties, memo, useMemo } from "react";
import { IsoBox, IsoFace } from "@/components/iso/Iso";
import { iso, isoEllipseRadii, type Material, material } from "@/lib/iso";
import styles from "./Avatar.module.css";
import {
  AVATAR_COLORS,
  type AvatarBox,
  type AvatarState,
  buildAvatar,
  forwardVector,
  type HeadFace,
  type Part,
} from "./model";

const MATS: Record<Exclude<Part, "case" | "head">, Material> = {
  skin: material(AVATAR_COLORS.skin, 0.2, 0.1),
  hair: material(AVATAR_COLORS.hair, 0.12, 0.2),
  hoodie: material(AVATAR_COLORS.hoodie),
  hoodieDark: material(AVATAR_COLORS.hoodieDark),
  pants: material(AVATAR_COLORS.pants, 0.18, 0.18),
  shoe: material(AVATAR_COLORS.shoe, 0, 0.1),
  phones: material(AVATAR_COLORS.phones),
  phonesBand: material(AVATAR_COLORS.phonesBand, 0, 0.1),
  controller: material(AVATAR_COLORS.controller, 0, 0.12),
};

/** Kafa: yanlar ten rengi, üst saç rengi. Ayrıntılar yüz desenleriyle çizilir. */
const HEAD_MAT: Material = { top: MATS.hair.top, left: MATS.skin.left, right: MATS.skin.right };

const LIMB_CLASS: Record<string, string | undefined> = {
  legL: styles.legL,
  legR: styles.legR,
  armL: styles.armL,
  armR: styles.armR,
  body: styles.body,
  head: styles.head,
};

const SEATED = new Set(["sit", "type", "mouse", "wave", "stretch"]);

interface AvatarProps {
  state: AvatarState;
  /** Elde taşınan proje kutusunun rengi */
  caseColor?: string;
}

function AvatarImpl({ state, caseColor = "#8b7cf6" }: AvatarProps) {
  const boxes = useMemo(
    () =>
      buildAvatar({
        pose: state.pose,
        facing: state.facing,
        headFacing: state.headFacing,
        headphones: state.headphones,
        holding: state.holding,
      }),
    [state.pose, state.facing, state.headFacing, state.headphones, state.holding],
  );
  const caseMat = useMemo(() => material(caseColor), [caseColor]);

  const [px, py] = iso(state.pos[0], state.pos[1], state.pos[2]);
  const [fx, fy] = forwardVector(state.facing);
  const standing = state.pos[2] < 0.1 && state.pose !== "hidden";
  const shadow = isoEllipseRadii(0.95);

  const style = {
    transform: `translate(${px}px, ${py}px)`,
    transition: `transform ${state.moveMs}ms linear`,
    "--fx": `${fx}px`,
    "--fy": `${fy}px`,
  } as CSSProperties;

  return (
    <g className={styles.avatar} style={style} data-pose={state.pose}>
      {standing ? <ellipse className={styles.shadow} cx={0} cy={0} rx={shadow.rx} ry={shadow.ry} /> : null}
      <g key={`${state.pose}-${state.facing}`} className={styles.figure} data-seated={SEATED.has(state.pose)}>
        {boxes.map((b) => (
          <g
            key={`${b.part}-${b.limb}-${b.box.x.toFixed(2)}-${b.box.y.toFixed(2)}-${b.box.z.toFixed(2)}`}
            className={LIMB_CLASS[b.limb]}
          >
            <IsoBox
              b={b.box}
              m={b.part === "head" ? HEAD_MAT : b.part === "case" ? caseMat : MATS[b.part]}
              soft={b.part === "head" ? 1.2 : 0.8}
            />
            {b.part === "head" && b.faces ? <HeadDecals b={b} /> : null}
            {b.part === "hoodie" && b.limb === "body" ? <TorsoDecal b={b} facing={state.facing} /> : null}
          </g>
        ))}
      </g>
    </g>
  );
}

export const Avatar = memo(AvatarImpl);

/* ---------- Yüz ve saç desenleri ---------- */

function HeadDecals({ b }: { b: AvatarBox }) {
  const { x, y, z, w, d, h } = b.box;
  if (!b.faces) return null;
  return (
    <>
      <IsoFace plane="x" at={[x + w, y + d, z + h]} k={d / 100} kv={h / 100}>
        <HeadFaceArt face={b.faces.x} hair={MATS.hair.right} skin={MATS.skin.right} />
      </IsoFace>
      <IsoFace plane="y" at={[x, y + d, z + h]} k={w / 100} kv={h / 100}>
        <HeadFaceArt face={b.faces.y} hair={MATS.hair.left} skin={MATS.skin.left} />
      </IsoFace>
    </>
  );
}

function HeadFaceArt({ face, hair, skin }: { face: HeadFace; hair: string; skin: string }) {
  if (face.kind === "front") {
    return (
      <g>
        <path d="M0,0 H100 V30 L90,23 L80,33 L68,24 L56,34 L44,24 L32,33 L20,23 L10,31 L0,25 Z" fill={hair} />
        <g className={styles.eyes}>
          <rect x="24" y="46" width="12" height="18" rx="5.5" fill="#2b2238" />
          <rect x="63" y="46" width="12" height="18" rx="5.5" fill="#2b2238" />
          <circle cx="28.5" cy="50.5" r="2.8" fill="#fff" />
          <circle cx="67.5" cy="50.5" r="2.8" fill="#fff" />
        </g>
        <ellipse cx="18" cy="71" rx="8" ry="4.5" fill="#f59fb4" opacity="0.75" />
        <ellipse cx="82" cy="71" rx="8" ry="4.5" fill="#f59fb4" opacity="0.75" />
        <path d="M43,72 Q50,79 57,72" stroke="#8a4250" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (face.kind === "back") {
    return (
      <g>
        <path d="M0,0 H100 V80 L88,86 L76,80 L64,87 L52,80 L40,87 L28,80 L16,86 L0,80 Z" fill={hair} />
        <path d="M30,14 Q50,6 72,16" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="5" fill="none" />
      </g>
    );
  }
  const backX = face.backAt === "start" ? 0 : 62;
  return (
    <g>
      <rect x="0" y="0" width="100" height="36" fill={hair} />
      <rect x={backX} y="0" width="38" height="82" fill={hair} />
      <rect x="43" y="47" width="15" height="21" rx="5" fill={skin} stroke="#c98f74" strokeWidth="2" />
    </g>
  );
}

function TorsoDecal({ b, facing }: { b: AvatarBox; facing: string }) {
  const { x, y, z, w, d, h } = b.box;
  // Kapüşonlunun ipleri ve cebi yalnızca önü kameraya bakarken görünür.
  if (facing === "+x") {
    return (
      <IsoFace plane="x" at={[x + w, y + d, z + h]} k={d / 100} kv={h / 100}>
        <HoodieFront />
      </IsoFace>
    );
  }
  if (facing === "+y") {
    return (
      <IsoFace plane="y" at={[x, y + d, z + h]} k={w / 100} kv={h / 100}>
        <HoodieFront />
      </IsoFace>
    );
  }
  return null;
}

function HoodieFront() {
  return (
    <g>
      <path d="M30,0 Q50,22 70,0" fill={MATS.hoodieDark.left} />
      <rect x="40" y="10" width="3.5" height="26" rx="1.5" fill="#ffffff" opacity="0.9" />
      <rect x="57" y="10" width="3.5" height="26" rx="1.5" fill="#ffffff" opacity="0.9" />
      <rect x="22" y="58" width="56" height="26" rx="6" fill={MATS.hoodieDark.left} opacity="0.75" />
    </g>
  );
}
