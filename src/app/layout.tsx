import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anubix | Kişisel dijital alan",
  description:
    "Projelerimi, çalışmalarımı ve zamanla geliştireceğim kişisel araçları bir araya getiren açık kaynaklı alan.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
