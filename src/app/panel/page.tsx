import type { Metadata } from "next";
import { PanelExperience } from "@/components/panel/PanelExperience";
import { panelFeatures } from "@/data/panelFeatures";
import { hasSession } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Anubix Dünyası | Kişisel panel",
  description: "Anubix kişisel çalışma alanı.",
  robots: { index: false, follow: false },
};

/** Oturum yoksa sunucu tarafında paneli göstermeyiz. */
export default async function PanelPage() {
  if (!(await hasSession())) redirect("/");
  return <PanelExperience features={panelFeatures} />;
}
