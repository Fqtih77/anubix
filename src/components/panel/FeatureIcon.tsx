import type { PanelFeatureId } from "@/data/panelFeatures";

/** 16×16 özgün piksel simgeler (alt çubuk ve pencere başlıkları için). */
const ICONS: Record<PanelFeatureId, { d: string; fill: string }[]> = {
  storage: [
    { d: "M1 5h14v9H1z", fill: "#c48a52" },
    { d: "M1 3h14v3H1z", fill: "#8f6239" },
    { d: "M7 6h2v3H7z", fill: "#ffe07a" },
    { d: "M1 9h14v1H1z", fill: "#8f6239" },
  ],
  notes: [
    { d: "M1 3h7v11H1z", fill: "#fffaf0" },
    { d: "M8 3h7v11H8z", fill: "#f4ecdc" },
    { d: "M7 3h2v11H7z", fill: "#8b7cf6" },
    { d: "M2 6h4v1H2zM2 8h4v1H2zM10 6h4v1h-4zM10 8h3v1h-3z", fill: "#cfc4b0" },
  ],
  quests: [
    { d: "M1 2h14v10H1z", fill: "#a87240" },
    { d: "M3 4h4v5H3z", fill: "#fffaf0" },
    { d: "M9 4h4v4H9z", fill: "#fff1a8" },
    { d: "M3 12h2v3H3zM11 12h2v3h-2z", fill: "#77502d" },
  ],
  calendar: [
    { d: "M1 2h14v13H1z", fill: "#fffaf0" },
    { d: "M1 2h14v3H1z", fill: "#62b6ee" },
    { d: "M3 7h2v2H3zM7 7h2v2H7zM11 7h2v2h-2zM3 11h2v2H3zM7 11h2v2H7z", fill: "#cfdcec" },
    { d: "M11 11h2v2h-2z", fill: "#f59f84" },
  ],
  assistant: [
    { d: "M3 4h10v8H3z", fill: "#ffffff" },
    { d: "M4 5h8v5H4z", fill: "#2a2639" },
    { d: "M5 7h2v2H5zM9 7h2v2H9z", fill: "#7ef0c8" },
    { d: "M7 1h2v3H7z", fill: "#5bb35d" },
    { d: "M4 12h8v3H4z", fill: "#8fdcbc" },
  ],
};

export function FeatureIcon({ id }: { id: PanelFeatureId }) {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {ICONS[id].map((p) => (
        <path key={p.d} d={p.d} fill={p.fill} />
      ))}
    </svg>
  );
}
