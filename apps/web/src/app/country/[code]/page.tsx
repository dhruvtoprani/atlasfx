import { notFound } from "next/navigation";

import { CountryDetailClient } from "@/components/country-detail-client";
import { getCountryDetail } from "@/lib/atlas-data";
import { fetchCountryRisk } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const country = await fetchCountryRisk(code).catch(() => getCountryDetail(code));

  if (!country) {
    notFound();
  }

  return <CountryDetailClient initialCountry={country} />;
}
