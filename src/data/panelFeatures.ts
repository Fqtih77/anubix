/**
 * KİŞİSEL PANEL ÖZELLİKLERİ
 * -------------------------
 * Panel haritasındaki her yapı oturumla korunan bir özelliğe karşılık gelir.
 */

export type PanelFeatureId = "storage" | "notes" | "quests" | "calendar" | "assistant" | "projects";

export interface PanelFeature {
  id: PanelFeatureId;
  /** Kısayol tuşu ve alt çubuktaki sıra */
  key: string;
  /** Haritadaki yapının adı */
  title: string;
  /** Özelliğin asıl adı */
  subtitle: string;
  description: string;
  /** İleride yapılacaklar (henüz yok) */
  planned: string[];
  color: string;
}

export const panelFeatures: PanelFeature[] = [
  {
    id: "storage",
    key: "1",
    title: "Sandık",
    subtitle: "Kişisel dosya deposu",
    description: "Belgelerimi ve dosyalarımı saklayacağım alan.",
    planned: ["Klasörler", "Otomatik yedekleme"],
    color: "#c98a4b",
  },
  {
    id: "notes",
    key: "2",
    title: "Çalışma masası",
    subtitle: "Notlar",
    description: "Fikirlerimi, ders notlarımı ve taslaklarımı yazacağım defter.",
    planned: ["Etiket ve arama", "Markdown desteği"],
    color: "#8b7cf6",
  },
  {
    id: "quests",
    key: "3",
    title: "Görev panosu",
    subtitle: "Planlayıcı ve anımsatıcılar",
    description: "Günlük ve haftalık görevlerim, anımsatıcılarım.",
    planned: ["Öncelik", "Özel tekrar kuralları"],
    color: "#f2a35a",
  },
  {
    id: "calendar",
    key: "4",
    title: "Duvar takvimi",
    subtitle: "Takvim",
    description: "Etkinliklerim ve teslim tarihlerim.",
    planned: ["Görevlerle bağlantı", "Saat bazlı hatırlatmalar"],
    color: "#62b6ee",
  },
  {
    id: "assistant",
    key: "5",
    title: "Bix",
    subtitle: "Yerel AI asistanı",
    description: "Ollama üzerinden kendi bilgisayarımda çalışan modele bağlanan yardımcı karakter.",
    planned: ["Notlar ve görevlerle izinli çalışma"],
    color: "#6fd3b1",
  },
  {
    id: "projects",
    key: "6",
    title: "Komut bloğu",
    subtitle: "Proje yöneticisi",
    description:
      "Odadaki proje masaüstüne koda dokunmadan proje eklediğim, düzenlediğim, sıraladığım ve gizlediğim yer.",
    planned: [],
    color: "#e8892e",
  },
];
