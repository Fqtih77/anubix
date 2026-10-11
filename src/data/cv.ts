/**
 * ÖZGEÇMİŞ (CV) VERİSİ
 * --------------------
 * Odadaki "CV" plağı bilgisayara takılınca açılan ekran bu dosyadan beslenir.
 * İçerik `fatih_ozturk_cv.tex` dosyasından (Jake's Resume formatı) aktarıldı.
 * Orijinal PDF `public/cv/fatih-ozturk-cv.pdf` olarak indirilebilir.
 *
 * Metinlerde **çift yıldız** arasındaki kısım kalın yazılır (LaTeX'teki \textbf gibi).
 * Not: Bu dosya ve PDF herkese açık sitede ve GitHub deposunda görünür. Telefon
 * numarası gibi bir bilgiyi gizlemek istersen buradan silmen yeterli.
 */

export interface CvContact {
  label: string;
  href?: string;
}

export interface CvEntry {
  title: string;
  right: string;
  subtitle: string;
  subtitleRight: string;
  bullets: string[];
}

export interface CvProject {
  name: string;
  link?: CvContact;
  tech: string;
  date: string;
  bullets: string[];
}

export interface CvLine {
  title: string;
  detail: string;
  date: string;
}

export interface CvSkill {
  label: string;
  value: string;
  /** Bir önceki becerinin satırında devam eder (LaTeX'teki \quad) */
  sameLine?: boolean;
}

export interface Cv {
  name: string;
  headline: string;
  contact: CvContact[];
  summary: string;
  education: CvEntry[];
  experience: CvEntry[];
  projects: CvProject[];
  achievements: CvLine[];
  skills: CvSkill[];
  pdf: string;
}

export const cv: Cv = {
  name: "Fatih Öztürk",
  headline: "Bilgisayar Mühendisliği Öğrencisi | Yapay Zeka & Yazılım Geliştirici",
  contact: [
    { label: "+90 505 037 63 60" },
    { label: "Ankara" },
    { label: "fatihozturk0631@gmail.com", href: "mailto:fatihozturk0631@gmail.com" },
    { label: "linkedin.com/in/fqtih77", href: "https://linkedin.com/in/fqtih77" },
    { label: "github.com/Fqtih77", href: "https://github.com/Fqtih77" },
  ],
  summary:
    "Bilgisayar Mühendisliği 3. sınıf öğrencisiyim. Yapay zeka destekli sistemler, otonom İHA'lar ve web/mobil geliştirme alanlarında TEKNOFEST ve TÜBİTAK projelerinde yer alıyor; bir SaaS girişiminin kurucu ekibinde proje yürütücülüğü, frontend ve sunucu işlerini üstleniyorum. Hedefim yazılım ve donanımda çok yönlü bir mühendis olmak.",
  education: [
    {
      title: "Selçuk Üniversitesi, Teknoloji Fakültesi",
      right: "Konya",
      subtitle: "Bilgisayar Mühendisliği (3. Sınıf) — Genel Not Ortalaması: 3.17 / 4.00",
      subtitleRight: "Eylül 2024 – Haziran 2028",
      bullets: [],
    },
  ],
  experience: [
    {
      title: "Optiv / Retinax — Full-Stack Geliştirici (Serbest)",
      right: "2026",
      subtitle: "Optik Ürün Tanıtımı ve B2B Yönetim Platformu",
      subtitleRight: "Next.js, TypeScript, Three.js",
      bullets: [
        "Güneş camı toptancısı için ürün tanıtımını bayi ve yönetim panelleriyle birleştiren platformu **tek başıma** geliştirip yayına aldım",
        "3D gözlük animasyonları, 8 cam tonlu ürün deneyimi ve sipariş, stok, cari takibi yapılan yönetim panelleri",
      ],
    },
    {
      title: "TAVUS — Kurucu Üye & Proje Yürütücüsü",
      right: "2025 – Devam Ediyor",
      subtitle: "Multi-tenant Dershane Yönetim SaaS Platformu (Web & Mobil)",
      subtitleRight: "React, Expo, PostgreSQL",
      bullets: [
        "Dershane yönetimini dijitalleştiren platformun **proje yürütücüsü** olarak planlamayı, ekip koordinasyonunu ve müşteri iletişimini yönetiyorum",
        "React, Tailwind ve shadcn/ui ile web paneli, Expo ile mobil uygulamanın **frontend** geliştirmesini yapıyorum",
        "**Sunucu** kurulumu, yapılandırması ve deployment süreçlerinden sorumluyum",
        "7 kullanıcı rolü, PostgreSQL RLS ile tenant izolasyonu, JWT RS256 auth ve YZ destekli öğrenci analitiği",
      ],
    },
    {
      title: "Yönetim Kurulu Üyesi — Tasarımcı & Organizasyon Görevlisi",
      right: "2024 – Devam Ediyor",
      subtitle: "Selçuk Üniversitesi Algoritma ve Yapay Zeka Topluluğu (AYZEK)",
      subtitleRight: "Konya",
      bullets: [
        "Topluluğun görsel kimliğini ve tasarım süreçlerini yönettim; etkinliklerin koordinasyonunda görev aldım",
        "Topluluğun web sitesinin UI/UX tasarımını, frontend geliştirmesini ve deployment sürecini tamamladım",
      ],
    },
  ],
  projects: [
    {
      name: "Acceltra — TEKNOFEST Avcı Drone",
      tech: "Python, YOLOv8n, Kalman Filtresi, PID, ELRS",
      date: "2026",
      bullets: [
        "GNSS karıştırması altında FPV drone ile sabit kanatlı hedef İHA'yı insan müdahalesi olmadan bulan, takip eden ve vuran özgün bir otonom sistem geliştirdik; bozuk konum verisini filtreleyip drone'u hedefe yönelttik",
        "Yer istasyonunda YOLOv8n ile tespit, Kalman filtresiyle takip, PID ile güdüm ve ELRS ile komut iletimi",
        "**Donanım sorumlusu** olarak drone'un donanım kurulumu, bileşen entegrasyonu ve uçuş hazırlığını yürüttüm",
        "Algoritma Tasarım Raporu'nun ortak yazarı olarak angajman, failsafe ve literatür bölümlerini hazırladım",
        "ADR aşamasını **82.50 puanla** geçtik; rapor, simülasyon ve uçuş aşamalarını tamamlayarak **finale kaldık**",
      ],
    },
    {
      name: "Anubix",
      link: { label: "anubix.dev", href: "https://www.anubix.dev" },
      tech: "Next.js, TypeScript, Yerel LLM",
      date: "2026 – Devam Ediyor",
      bullets: [
        "CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getiren; planlayıcı, not defteri, takvim/anımsatıcı ve kişisel dosya deposu içeren kişisel platformumu geliştiriyorum",
        "Kendi iş akışlarıma göre özelleştirdiğim yerel bir dil modelini asistan olarak entegre ediyorum",
      ],
    },
    {
      name: "TÜBİTAK 2209-A — Otonom Sürü Haberleşme Mimarisi",
      tech: "PyTorch, OpenCV, NS-3",
      date: "2025",
      bullets: [
        "İHA sürüleri için YOLOv8-Tiny ile veri önceliklendirme, bilişsel radyo ile frekans seçimi ve DQN ile rota optimizasyonunu birleştiren bir mimari tasarladım; NS-3 ile co-simulation kurdum (Danışman: Dr. Onur İnan)",
      ],
    },
    {
      name: "Mentorium — TEKNOFEST Eğitim Teknolojileri",
      tech: "Flutter, Dart",
      date: "Mart 2025 – Ağustos 2025",
      bullets: [
        "YZ chatbot, fotoğrafla soru çözümü (VLM) ve öğretmen paneli sunan eğitim koçluğu uygulamasında **frontend geliştirici** olarak UI/UX ve Flutter arayüzünü yaptım",
      ],
    },
  ],
  achievements: [
    {
      title: "TEKNOFEST 5G ve Yapay Zeka Akıllı Yol Güvenliği",
      detail: "PDR aşaması 83.33 puanla tamamlandı",
      date: "2026",
    },
    {
      title: "T3 Vakfı “Sen Geleceksin” Burs Programı",
      detail: "Bursiyer, gönüllülük faaliyetleri",
      date: "2025 – Devam Ediyor",
    },
  ],
  skills: [
    {
      label: "Diller & Çerçeveler",
      value: "Python, TypeScript, Dart, React, Next.js, Expo, Flutter, FastAPI, Tailwind, Three.js",
    },
    {
      label: "Yapay Zeka ve Kontrol",
      value: "PyTorch, TensorFlow, OpenCV, YOLOv8, Kalman Filtresi, PID, DQN",
    },
    { label: "Araçlar", value: "PostgreSQL, Docker, Git, Zustand, Framer Motion, NS-3, ELRS" },
    { label: "Yabancı Dil", value: "İngilizce (A2–B1)", sameLine: true },
  ],
  pdf: "/cv/fatih-ozturk-cv.pdf",
};
