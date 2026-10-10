import { memo, type Ref } from "react";
import { boundsOf, type P2 } from "@/lib/iso";
import styles from "./Hotspots.module.css";
import type { RegionId } from "./layout";

/**
 * Tıklanabilir nesneler. Her nesne gerçek bir `<button>`dır: klavyeyle odaklanır,
 * ekran okuyucu adını okur. Düğmenin şekli `clip-path` ile nesnenin silüetine kırpılır.
 * Bu katman SVG ile aynı kutunun içinde olduğu için kamerayla birlikte hareket eder.
 */

export interface HotspotDef {
  id: string;
  /** Üzerine gelince görünen kısa ad */
  label: string;
  /** İkinci satır: ne olacağını söyler */
  hint: string;
  /** Ekran okuyucu için tam açıklama */
  ariaLabel: string;
  region: RegionId;
  /** Silüet çokgeni (tuval pikseli) */
  polygon: P2[];
  /** Keşfi kolaylaştıran parıltı işareti */
  marker?: "spark" | "secret";
}

export interface Bubble {
  text: string;
  id: number;
  at: P2;
}

interface Props {
  hotspots: HotspotDef[];
  busy: boolean;
  /** Parıltılar yalnızca bu bölgede görünür; böylece her şey aynı anda yanıp sönmez. */
  activeRegion: RegionId;
  showMarkers: boolean;
  bubble: Bubble | null;
  onActivate: (id: string) => void;
  onHot: (id: string | null) => void;
  onFocusSpot: (spot: HotspotDef) => void;
  ref?: Ref<HTMLDivElement>;
}

function HotspotLayerImpl({ hotspots, busy, activeRegion, showMarkers, bubble, onActivate, onHot, onFocusSpot, ref }: Props) {
  return (
    <div ref={ref} className={styles.layer} data-busy={busy}>
      {hotspots.map((spot) => {
        const r = boundsOf(spot.polygon);
        const clip = spot.polygon.map(([x, y]) => `${(x - r.x).toFixed(1)}px ${(y - r.y).toFixed(1)}px`).join(", ");
        const outline = spot.polygon.map(([x, y]) => `${(x - r.x).toFixed(1)},${(y - r.y).toFixed(1)}`).join(" ");
        return (
          <div key={spot.id} className={styles.spot} style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
            <button
              type="button"
              className={styles.hit}
              style={{ clipPath: `polygon(${clip})` }}
              aria-label={spot.ariaLabel}
              aria-disabled={busy || undefined}
              onClick={() => onActivate(spot.id)}
              onPointerEnter={() => onHot(spot.id)}
              onPointerLeave={() => onHot(null)}
              onFocus={(event) => {
                onHot(spot.id);
                // Yalnızca klavyeyle gelinen odakta kamerayı o bölgeye götür (fare tıklamasında değil).
                if (event.currentTarget.matches(":focus-visible")) onFocusSpot(spot);
              }}
              onBlur={() => onHot(null)}
            />
            <svg className={styles.outline} width={r.w} height={r.h} aria-hidden="true" focusable="false">
              <polygon points={outline} />
            </svg>
            <span className={styles.label} aria-hidden="true">
              <strong>{spot.label}</strong>
              <small>{spot.hint}</small>
            </span>
            {spot.marker && showMarkers && spot.region === activeRegion ? (
              <span className={styles.marker} data-kind={spot.marker} aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
      {bubble ? (
        <div key={bubble.id} className={styles.bubble} style={{ left: bubble.at[0], top: bubble.at[1] }} aria-hidden="true">
          <span>{bubble.text}</span>
        </div>
      ) : null}
    </div>
  );
}

export const HotspotLayer = memo(HotspotLayerImpl);
