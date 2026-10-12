import { connection } from "next/server";
import { RoomExperience } from "@/components/room/RoomExperience";
import { publicProjects } from "@/lib/server/projects";

/**
 * Ana sayfa: izometrik oda.
 * Bu dosya bir Sunucu Bileşenidir; projeleri veritabanından okuyup etkileşimli odaya
 * (İstemci Bileşeni) aktarır. Odanın bütün mantığı `src/components/room/` altında.
 */
export default async function Home() {
  // Projeler panelden değiştirilebildiği için sayfa derlemede değil, her istekte hazırlanır.
  await connection();
  return <RoomExperience projects={await publicProjects()} />;
}
