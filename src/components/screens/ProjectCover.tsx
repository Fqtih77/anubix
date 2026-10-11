import { type Project, projectInitial } from "@/data/projects";

/**
 * Proje kapağı: panelden görsel yüklenene kadar kodla çizilmiş özgün bir kapak.
 * Anubix için yüzen voxel ada, diğer projeler için proje renginde büyük bir baş harf.
 * `project.image` doluysa ProjectShowcase onu kullanır.
 */
export function ProjectCover({ project, className }: { project: Project; className?: string }) {
  const id = `cover-${project.id}`;
  if (project.cover === "letter") {
    return (
      <svg className={className} viewBox="0 0 400 400" role="img" aria-label={`${project.title} için çizilmiş kapak`}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={project.accent} />
            <stop offset="1" stopColor="#241a4a" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" rx="28" fill={`url(#${id}-bg)`} />
        {/* Arkada izometrik küpler */}
        {[
          [70, 300, 46],
          [330, 120, 38],
          [300, 320, 28],
          [96, 96, 24],
        ].map(([x, y, r]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} opacity="0.35">
            <path d={`M0,${-r} L${r},${-r / 2} L0,0 L${-r},${-r / 2} Z`} fill={project.accent2} />
            <path d={`M${-r},${-r / 2} L0,0 L0,${r} L${-r},${r / 2} Z`} fill="#ffffff" opacity="0.5" />
            <path d={`M${r},${-r / 2} L0,0 L0,${r} L${r},${r / 2} Z`} fill="#000000" opacity="0.25" />
          </g>
        ))}
        <text
          x="200"
          y="252"
          textAnchor="middle"
          fontSize="200"
          fontWeight="700"
          fill="#ffffff"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          {projectInitial(project)}
        </text>
        <rect x="32" y="300" width="336" height="4" rx="2" fill={project.accent2} opacity="0.8" />
        <text x="32" y="352" fontSize="26" fontWeight="700" fill="#ffffff" style={{ fontFamily: "var(--font-pixel), monospace" }}>
          {project.title.toLocaleUpperCase("tr-TR")}
        </text>
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 400 400" role="img" aria-label={`${project.title} için çizilmiş kapak`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={project.accent} />
          <stop offset="1" stopColor="#3b2f7a" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="28" fill={`url(#${id}-bg)`} />
      {Array.from({ length: 22 }, (_, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: sabit, sırası değişmeyen süs yıldızları
          key={i}
          x={20 + ((i * 71) % 360)}
          y={18 + ((i * 47) % 170)}
          width={i % 3 ? 4 : 6}
          height={i % 3 ? 4 : 6}
          fill="#ffffff"
          opacity={0.25 + (i % 4) * 0.15}
        />
      ))}
      {/* Yüzen voxel ada */}
      <g transform="translate(200 250)">
        <path d="M0,-60 L110,-5 L0,50 L-110,-5 Z" fill={project.accent2} />
        <path d="M-110,-5 L0,50 L0,92 L-110,37 Z" fill="#b98a62" />
        <path d="M110,-5 L0,50 L0,92 L110,37 Z" fill="#9c7350" />
        <path d="M-110,37 L0,92 L0,112 L-60,84 Z" fill="#7d5b40" />
        <rect x="40" y="-86" width="14" height="46" fill="#9c7350" />
        <rect x="16" y="-140" width="62" height="58" fill="#4fae7a" />
        <rect x="28" y="-158" width="38" height="24" fill="#6fd3b1" />
      </g>
      {/* "A" işareti */}
      <g transform="translate(118 92)">
        <path d="M0,96 L42,0 L58,0 L100,96 L78,96 L50,30 L22,96 Z" fill="#ffffff" />
        <rect x="30" y="58" width="40" height="14" fill="#ffffff" />
      </g>
      <text x="32" y="372" fontSize="26" fontWeight="700" fill="#ffffff" style={{ fontFamily: "var(--font-pixel), monospace" }}>
        {project.title.toUpperCase()}
      </text>
    </svg>
  );
}
