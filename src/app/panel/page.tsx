import type { Metadata } from "next";
import { PanelExperience } from "@/components/panel/PanelExperience";
import { panelFeatures } from "@/data/panelFeatures";
import { hasSession } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Anubix Dünyası | Kişisel panel",
  description: "Anubix kişisel çalışma alanı.",
  robots: { index: false, follow: false },
};

/** Oturum yoksa sunucu tarafında paneli göstermeyiz. */
export default async function PanelPage() {
  // Docker imajı sırlar olmadan derlenir; oturum kararı derlemede sabitlenmemeli.
  await connection();
  if (!(await hasSession())) redirect("/");
  return <PanelExperience features={panelFeatures} />;
}
