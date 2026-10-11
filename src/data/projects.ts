/**
 * PROJE VERİLERİ
 * --------------
 * Projeler artık veritabanında (SQLite) tutulur ve kişisel paneldeki "Komut bloğu"ndan
 * koda dokunmadan eklenir, düzenlenir, sıralanır ve gizlenir.
 *
 * Bu dosyadaki `defaultProjects` listesi yalnızca başlangıç verisidir: veritabanı ilk kez
 * açıldığında bir kez içeri aktarılır (bkz. `src/lib/server/projects.ts`). Sonrasında
 * değişiklikleri panelden yap; buradaki liste yalnızca yeni bir kurulumda kullanılır.
 *
 * İçerikler CV'deki bilgilere dayanır; CV'de olmayan bağlantı veya başarı uydurulmadı.
 */

export type ProjectStatus = "in-progress" | "completed";

/** Görsel yoksa kapakta çizilecek motif: Anubix adası ya da projenin baş harfi. */
export type CoverMotif = "anubix" | "letter";

export interface Project {
  /** URL ve anahtar olarak kullanılan kısa ad (ör. "anubix") */
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
  /** Klasör, kapak ve tanıtım ekranının ana rengi */
  accent: string;
  /** İkincil vurgu rengi */
  accent2: string;
  cover: CoverMotif;
  /** Panelden yüklenen görsel (veritabanındaki projeler için API adresi) */
  image?: { src: string; alt: string };
}

export const defaultProjects: Project[] = [
  {
    id: "anubix",
    title: "Anubix",
    tagline: "Kişisel dijital alanım",
    status: "in-progress",
    period: "2026 – Devam ediyor",
    summary: "CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getiren kişisel platformum.",
    description:
      "Planlayıcı, not defteri, takvim/anımsatıcı ve kişisel dosya deposu içeren bir alan geliştiriyorum. Kendi iş akışlarıma göre özelleştirdiğim yerel bir dil modelini asistan olarak entegre ediyorum.",
    done: [
      "Next.js, React ve TypeScript ile kurulmuş, Docker'da çalışan iskelet",
      "Etkileşimli oda arayüzü (şu an gezdiğin sayfa)",
      "Oturum korumalı kişisel panel; not, görev, takvim, dosya ve proje araçları",
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
  {
    id: "acceltra",
    title: "Acceltra",
    tagline: "TEKNOFEST Avcı Drone",
    status: "completed",
    period: "2026",
    summary:
      "GNSS karıştırması altında FPV drone ile sabit kanatlı hedef İHA'yı insan müdahalesi olmadan bulan, takip eden ve vuran özgün otonom sistem.",
    description:
      "Bozuk konum verisini filtreleyip drone'u hedefe yönelttik. Yer istasyonunda YOLOv8n ile tespit, Kalman filtresiyle takip, PID ile güdüm ve ELRS ile komut iletimi kullanıldı. Ekipte donanım sorumlusuydum.",
    done: [
      "Drone'un donanım kurulumu, bileşen entegrasyonu ve uçuş hazırlığı",
      "Algoritma Tasarım Raporu'nun angajman, failsafe ve literatür bölümleri",
      "ADR aşaması 82.50 puanla geçildi; rapor, simülasyon ve uçuş aşamalarıyla finale kalındı",
    ],
    planned: [],
    tech: ["Python", "YOLOv8n", "Kalman Filtresi", "PID", "ELRS"],
    links: {},
    accent: "#ef8a5b",
    accent2: "#ffd1a6",
    cover: "letter",
  },
  {
    id: "tavus",
    title: "TAVUS",
    tagline: "Dershane yönetim platformu (web ve mobil)",
    status: "in-progress",
    period: "2025 – Devam ediyor",
    summary: "Dershane yönetimini dijitalleştiren multi-tenant SaaS platformu. Kurucu üye ve proje yürütücüsüyüm.",
    description:
      "Planlamayı, ekip koordinasyonunu ve müşteri iletişimini yönetiyorum. Web panelinin ve Expo ile mobil uygulamanın frontend geliştirmesini, sunucu kurulumu, yapılandırması ve deployment süreçlerini üstleniyorum.",
    done: [
      "React, Tailwind ve shadcn/ui ile web paneli",
      "Expo ile mobil uygulama",
      "7 kullanıcı rolü ve PostgreSQL RLS ile tenant izolasyonu",
      "JWT RS256 kimlik doğrulama ve YZ destekli öğrenci analitiği",
    ],
    planned: [],
    tech: ["React", "Expo", "PostgreSQL", "Tailwind", "shadcn/ui"],
    links: {},
    accent: "#3fb68b",
    accent2: "#bff0dc",
    cover: "letter",
  },
  {
    id: "optiv-retinax",
    title: "Optiv / Retinax",
    tagline: "Optik ürün tanıtımı ve B2B yönetim platformu",
    status: "completed",
    period: "2026",
    summary:
      "Güneş camı toptancısı için ürün tanıtımını bayi ve yönetim panelleriyle birleştiren platform. Serbest full-stack geliştirici olarak tek başıma geliştirip yayına aldım.",
    description:
      "3D gözlük animasyonları ve 8 cam tonlu ürün deneyimini; sipariş, stok ve cari takibi yapılan yönetim panelleriyle aynı platformda birleştirdim.",
    done: ["3D gözlük animasyonları", "8 cam tonlu ürün deneyimi", "Sipariş, stok ve cari takibi yapan paneller"],
    planned: [],
    tech: ["Next.js", "TypeScript", "Three.js"],
    links: {},
    accent: "#2f7de1",
    accent2: "#a9d4fb",
    cover: "letter",
  },
  {
    id: "otonom-suru",
    title: "Otonom Sürü Haberleşme",
    tagline: "TÜBİTAK 2209-A araştırma projesi",
    status: "completed",
    period: "2025",
    summary: "İHA sürüleri için veri önceliklendirme, frekans seçimi ve rota optimizasyonunu birleştiren haberleşme mimarisi.",
    description:
      "YOLOv8-Tiny ile veri önceliklendirme, bilişsel radyo ile frekans seçimi ve DQN ile rota optimizasyonunu birleştiren bir mimari tasarladım; NS-3 ile co-simulation kurdum. Danışman: Dr. Onur İnan.",
    done: [
      "YOLOv8-Tiny ile veri önceliklendirme",
      "Bilişsel radyo ile frekans seçimi",
      "DQN ile rota optimizasyonu",
      "NS-3 ile co-simulation",
    ],
    planned: [],
    tech: ["PyTorch", "OpenCV", "NS-3"],
    links: {},
    accent: "#5b6ee1",
    accent2: "#c7cdfb",
    cover: "letter",
  },
  {
    id: "mentorium",
    title: "Mentorium",
    tagline: "TEKNOFEST Eğitim Teknolojileri",
    status: "completed",
    period: "Mart 2025 – Ağustos 2025",
    summary: "YZ chatbot, fotoğrafla soru çözümü (VLM) ve öğretmen paneli sunan eğitim koçluğu uygulaması.",
    description: "Frontend geliştirici olarak uygulamanın UI/UX tasarımını ve Flutter arayüzünü yaptım.",
    done: ["UI/UX tasarımı", "Flutter ile uygulama arayüzü"],
    planned: [],
    tech: ["Flutter", "Dart"],
    links: {},
    accent: "#e8b84f",
    accent2: "#fff0b8",
    cover: "letter",
  },
  {
    id: "ayzek",
    title: "AYZEK Web Sitesi",
    tagline: "Algoritma ve Yapay Zeka Topluluğu",
    status: "completed",
    summary: "Selçuk Üniversitesi Algoritma ve Yapay Zeka Topluluğu'nun web sitesi.",
    description:
      "Topluluğun yönetim kurulu üyesi olarak sitenin UI/UX tasarımını, frontend geliştirmesini ve deployment sürecini tamamladım.",
    done: ["UI/UX tasarımı", "Frontend geliştirme", "Deployment"],
    planned: [],
    tech: [],
    links: {},
    accent: "#e2668f",
    accent2: "#ffc9da",
    cover: "letter",
  },
];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "in-progress": "Devam ediyor",
  completed: "Tamamlandı",
};

/** Klasör ve kapaklarda kullanılan baş harf (Türkçe büyük harf kurallarıyla). */
export function projectInitial(p: Pick<Project, "title">) {
  return (p.title.trim()[0] ?? "?").toLocaleUpperCase("tr-TR");
}
