import { DashboardClient } from "@/components/dashboard-client";
import { fallbackGlobalRiskData, fetchGlobalRisk } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await fetchGlobalRisk().catch(() => fallbackGlobalRiskData);
  return <DashboardClient initialData={initialData} />;
}
