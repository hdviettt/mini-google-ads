"use client";
import { useEffect, useState } from "react";
import { fetchAdvertisers, type Advertiser } from "@/lib/api";
import { PipelineCanvas } from "@/components/canvas/PipelineCanvas";

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvertisers()
      .then(setAdvertisers)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>
          Mini Google Ads
        </h1>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
          auction sandbox
        </span>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-dim)" }}>
          {advertisers
            ? `${advertisers.length} advertisers loaded`
            : error
            ? `error: ${error}`
            : "loading..."}
        </div>
      </header>
      <main style={{ flex: 1, position: "relative" }}>
        <PipelineCanvas />
      </main>
    </div>
  );
}
