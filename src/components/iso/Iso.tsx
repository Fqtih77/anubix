import type { ReactNode, SVGProps } from "react";
import {
  type Box3,
  boxFaces,
  faceMatrix,
  isoEllipseRadii,
  isoP,
  type Material,
  type P3,
  poly3,
  topMatrix,
} from "@/lib/iso";

/**
 * Sahnelerde tekrar tekrar kullanılan küçük SVG yapı taşları.
 * Hepsi oda koordinatı alır; izdüşüm hesabı `src/lib/iso.ts` içindedir.
 */

interface IsoBoxProps {
  b: Box3;
  m: Material;
  className?: string;
  /** Ön kenarlara ince parlak çizgi çeker (oyuncak maket hissi). */
  edge?: string;
  /** Köşeleri yumuşatmak için yüzlere aynı renkte yuvarlak kontur ekler. */
  soft?: number;
  opacity?: number;
}

export function IsoBox({ b, m, className, edge, soft, opacity }: IsoBoxProps) {
  const f = boxFaces(b);
  const softStroke = (fill: string) =>
    soft ? { stroke: fill, strokeWidth: soft, strokeLinejoin: "round" as const } : undefined;
  const x2 = b.x + b.w;
  const y2 = b.y + b.d;
  const z2 = b.z + b.h;
  return (
    <g className={className} opacity={opacity}>
      <polygon points={f.left} fill={m.left} {...softStroke(m.left)} />
      <polygon points={f.right} fill={m.right} {...softStroke(m.right)} />
      <polygon points={f.top} fill={m.top} {...softStroke(m.top)} />
      {edge ? (
        <polyline
          points={poly3([
            [b.x, y2, z2],
            [x2, y2, z2],
            [x2, b.y, z2],
          ])}
          fill="none"
          stroke={edge}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}

type PolyProps = Omit<SVGProps<SVGPolygonElement>, "points"> & { pts: readonly P3[] };

export function IsoPoly({ pts, ...rest }: PolyProps) {
  return <polygon points={poly3(pts)} {...rest} />;
}

type DiscProps = Omit<SVGProps<SVGEllipseElement>, "cx" | "cy" | "rx" | "ry"> & { c: P3; r: number };

/** Yatay daire (ör. masa üstü, puf tabanı). */
export function IsoDisc({ c, r, ...rest }: DiscProps) {
  const [cx, cy] = isoP(c);
  const { rx, ry } = isoEllipseRadii(r);
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...rest} />;
}

interface CylinderProps {
  /** Alt merkez noktası */
  c: P3;
  r: number;
  h: number;
  side: string;
  top: string;
  className?: string;
}

/** Dik silindir: saksı, kupa, lamba gövdesi. */
export function IsoCylinder({ c, r, h, side, top, className }: CylinderProps) {
  const [cx, cyBottom] = isoP(c);
  const [, cyTop] = isoP([c[0], c[1], c[2] + h]);
  const { rx, ry } = isoEllipseRadii(r);
  const d = `M${cx - rx},${cyTop} L${cx - rx},${cyBottom} A${rx},${ry} 0 0 0 ${cx + rx},${cyBottom} L${cx + rx},${cyTop} Z`;
  return (
    <g className={className}>
      <path d={d} fill={side} />
      <ellipse cx={cx} cy={cyTop} rx={rx} ry={ry} fill={top} />
    </g>
  );
}

interface FaceProps {
  plane: "x" | "y";
  /** Yüzeyin ekrandan bakınca sol-üst köşesi (oda koordinatı). */
  at: P3;
  /** Bir yerel pikselin oda birimi karşılığı. Varsayılan: 0.01 (100 yerel px = 1 birim). */
  k?: number;
  /** Dikey eksen için ayrı ölçek (verilmezse k). */
  kv?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Çocuklarını duvara paralel bir yüzeye "yapıştırır".
 * İçerik düz 2B çizilir (x sağa, y aşağı), matris onu izometrik düzleme eğer.
 */
export function IsoFace({ plane, at, k = 0.01, kv, className, children }: FaceProps) {
  return (
    <g transform={faceMatrix(plane, at, k, kv)} className={className}>
      {children}
    </g>
  );
}

interface TopProps {
  at: P3;
  k?: number;
  kv?: number;
  className?: string;
  children: ReactNode;
}

/** Çocuklarını yatay bir yüzeye yapıştırır (u → +x, v → +y). */
export function IsoTop({ at, k = 0.01, kv, className, children }: TopProps) {
  return (
    <g transform={topMatrix(at, k, kv)} className={className}>
      {children}
    </g>
  );
}
