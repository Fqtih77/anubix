/**
 * PROJE VERİLERİ
 * --------------
 * Raflardaki kutular, proje tanıtım ekranı ve sayfa altındaki hızlı liste bu diziden beslenir.
 * Yeni proje eklemek için diziye bir nesne ekle. Odadaki raf yuvası sayısı
 * `src/components/room/layout.ts` içindeki `SHELF_SLOTS` dizisidir; ilk yuvalar sırayla dolar.
 *
 * Dürüstlük kuralı: `status: "placeholder"` olan kayıtlar gerçek proje değildir,
 * arayüzde açıkça "Örnek proje / içerik eklenecek" olarak gösterilir.
 */

export type ProjectStatus = "in-progress" | "completed" | "placeholder";

/** Kapakta çizilecek özgün motif. Gerçek görsel eklenince `image` alanı kullanılır. */
export type CoverMotif = "anubix" | "blank";

export interface Project {
  /** URL ve anahtar olarak kullanılan kısa ad */
  id: string;
  title: string;
  tagline: string;
  status: ProjectStatus;
  /** Ör. "2026 – Devam ediyor" */
  period?: string;
  summary: string;
  description: string;
  /** Şu an gerçekten var olanlar */
  done: string[];
  /** Planlanan, henüz yapılmamış işler */
  planned: string[];
  tech: string[];
  links: {
    github?: string;
    live?: string;
  };
  /** Canlı bağlantı yoksa neden olmadığını açıklayan not */
  liveNote?: string;
  /** Kutu ve tanıtım ekranının ana rengi */
  accent: string;
  /** İkincil vurgu rengi */
  accent2: string;
  cover: CoverMotif;
  /** İleride gerçek ekran görüntüsü eklemek için: public/ altındaki yol */
  image?: { src: string; alt: string };
}

export const projects: Project[] = [
  {
    id: "anubix",
    title: "Anubix",
    tagline: "Kişisel dijital alanım",
    status: "in-progress",
    period: "2026 – Devam ediyor",
    summary: "CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getirecek kişisel platformum.",
    description:
      "Planlayıcı, not defteri, takvim/anımsatıcı ve kişisel dosya deposu içerecek bir alan geliştiriyorum. Kendi iş akışlarıma göre özelleştirdiğim yerel bir dil modelini asistan olarak entegre etmeyi hedefliyorum.",
    done: [
      "Next.js, React ve TypeScript ile kurulmuş, Docker'da çalışan iskelet",
      "Etkileşimli oda arayüzü (şu an gezdiğin sayfa)",
      "Oturum korumalı kişisel panel; not, görev, takvim ve dosya araçları",
    ],
    planned: [
      "Panel araçları için gelişmiş arama ve düzenleme",
      "Dosya yedekleme ve bildirimler",
      "Yerel asistanın notlarla izinli çalışması",
    ],
    tech: ["Next.js 16", "React 19", "TypeScript", "SQLite", "Docker", "Ollama (isteğe bağlı)"],
    links: {
      github: "https://github.com/Fqtih77/anubix",
    },
    liveNote: "anubix.dev henüz yayında değil",
    accent: "#8b7cf6",
    accent2: "#6fd3b1",
    cover: "anubix",
  },
  placeholder(2, "#f29f86", "#ffd6a8"),
  placeholder(3, "#62b6ee", "#b5e2ff"),
  placeholder(4, "#e8b84f", "#fff0b8"),
];

/** Boş raf yuvası: gerçek proje bilgisi eklenene kadar dürüstçe "örnek" olarak görünür. */
function placeholder(n: number, accent: string, accent2: string): Project {
  const no = String(n).padStart(2, "0");
  return {
    id: `ornek-${no}`,
    title: `Örnek proje ${no}`,
    tagline: "İçerik eklenecek",
    status: "placeholder",
    summary: "Bu raf yuvası şimdilik boş. Gerçek proje bilgileri eklendiğinde burada görünecek.",
    description:
      "Bu bir yer tutucu kayıttır; arkasında gerçek bir proje yok. Başlık, açıklama, teknolojiler ve bağlantılar src/data/projects.ts dosyasından eklenecek.",
    done: [],
    planned: ["Proje adı ve kısa açıklama", "Kullanılan teknolojiler", "GitHub ve varsa canlı demo bağlantısı"],
    tech: [],
    links: {},
    accent,
    accent2,
    cover: "blank",
  };
}

export function isPlaceholder(p: Project) {
  return p.status === "placeholder";
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "in-progress": "Devam ediyor",
  completed: "Tamamlandı",
  placeholder: "Örnek proje · içerik eklenecek",
};
