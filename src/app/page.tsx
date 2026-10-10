import { RoomExperience } from "@/components/room/RoomExperience";
import { projects } from "@/data/projects";

/**
 * Ana sayfa: izometrik oda.
 * Bu dosya bir Sunucu Bileşenidir; proje verisini okuyup etkileşimli odaya (İstemci
 * Bileşeni) aktarır. Odanın bütün mantığı `src/components/room/` altında.
 */
export default function Home() {
  return <RoomExperience projects={projects} />;
}
