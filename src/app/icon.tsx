// T-07: Generated favicon via next/og ImageResponse.
// PLACEHOLDER: replace with properly sized icon once final logo SVG is delivered.
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080808",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f5f2ed",
          fontSize: 20,
          fontWeight: 600,
          fontFamily: "sans-serif",
        }}
      >
        n
      </div>
    ),
    size
  );
}
