"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

import { riskColor } from "@/lib/utils";
import type { CountryRiskRow } from "@/types/atlas";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function MoneyWeatherMap({ countries }: { countries: CountryRiskRow[] }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#090c12]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 158, center: [10, 6] }}
        className="relative z-10 h-full min-h-[360px] w-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#111827"
                stroke="#263244"
                strokeWidth={0.45}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#182235", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        {countries.map((country) => {
          const radius = Math.max(4, Math.min(13, country.riskScore / 7));
          const color = riskColor(country.riskLabel);
          return (
            <Marker key={country.countryCode} coordinates={[country.longitude, country.latitude]}>
              <title>{`${country.countryName}: ${country.riskScore} ${country.riskLabel}`}</title>
              <circle r={radius + 7} fill={color} opacity={0.08} />
              <circle r={radius} fill={color} fillOpacity={0.85} stroke="#020617" strokeWidth={1.5} />
            </Marker>
          );
        })}
      </ComposableMap>
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Signal Layer</p>
        <p className="text-sm text-slate-200">FX, RSS NLP news, and World Bank macro signals</p>
      </div>
    </div>
  );
}
