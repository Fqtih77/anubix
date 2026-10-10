import type { Metadata, Viewport } from "next";
import { Nunito, Pixelify_Sans } from "next/font/google";
import "./globals.css";

// Yazı tipleri derleme sırasında indirilir ve siteyle birlikte sunulur;
// ziyaretçinin tarayıcısı Google'a istek atmaz.
const body = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const pixel = Pixelify_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anubix | Odama hoş geldin",
  description:
    "Anubix: projelerimi ve kişisel araçlarımı topladığım açık kaynaklı dijital alan. İzometrik odayı gez, raftaki projelere göz at.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f6eee9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${body.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
