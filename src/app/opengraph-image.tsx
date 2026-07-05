import { ImageResponse } from "next/og";
import { COMPANY_NAME, SITE_NAME } from "@/lib/site";

export const alt = "ANSH Tasks — Task & Project Management for MSME Teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#a5b4fc",
            marginBottom: 16,
          }}
        >
          {COMPANY_NAME}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            background: "linear-gradient(90deg, #38bdf8, #818cf8, #e879f9)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 32,
            lineHeight: 1.35,
            color: "#e2e8f0",
            maxWidth: 900,
          }}
        >
          Task & project management for MSME teams — Kanban, Brain Boards, activity feed & more
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "#94a3b8",
          }}
        >
          tasks.anshapps.com · Free to start
        </div>
      </div>
    ),
    { ...size },
  );
}
