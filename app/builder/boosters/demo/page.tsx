import { getBoostersServer } from "@/lib/server-data";
import { BoosterDemo } from "@/components/client/booster-demo";

export default async function BuilderBoostersDemoPage() {
  const boosters = await getBoostersServer();
  return <BoosterDemo boosters={boosters} />;
}
