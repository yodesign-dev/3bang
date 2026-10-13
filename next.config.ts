import type { NextConfig } from "next";

// Content-Security-Policy:
// - cdn.sanity.io: ảnh trong bài, upload ở Sanity Studio.
// - *.api.sanity.io: Studio nhúng tại /studio đọc/ghi nội dung.
// - www.youtube-nocookie.com: player YouTube trong bài (chỉ tải khi bấm play).
// Ảnh bìa video YouTube đi qua next/image (tải ở server) nên không cần thêm vào img-src.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://cdn.sanity.io;
  font-src 'self';
  connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io;
  frame-src https://www.youtube-nocookie.com;
  frame-ancestors 'self';
  form-action 'self';
  base-uri 'self';
`.replace(/\n/g, " ").trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Ảnh bìa video YouTube (src/components/YouTubeEmbed.tsx)
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
