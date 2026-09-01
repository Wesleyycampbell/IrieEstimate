import { ImageResponse } from "next/og";

export const alt = "IrieEstimate — Jamaica Construction Labour Costs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#1a1a2e",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "#cfab45",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            IE
          </div>
          <span style={{ fontSize: "28px", fontWeight: 700, color: "#cfab45" }}>
            IrieEstimate
          </span>
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            maxWidth: "800px",
            marginBottom: "24px",
          }}
        >
          Know what your house will cost before you start.
        </div>
        <div style={{ fontSize: "24px", color: "#8b8fa8", maxWidth: "700px" }}>
          Free construction labour cost estimates across Jamaica&apos;s 14
          parishes. Compare tiers, customise finishes, get a detailed breakdown.
        </div>
      </div>
    ),
    { ...size }
  );
}
