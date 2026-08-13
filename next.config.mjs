const isProduction = process.env.NODE_ENV === "production";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

// Derived purely from the environment. A hardcoded project ref used to be
// trusted here unconditionally, which meant every deployment permanently
// allowed a foreign Supabase origin for connect/img/media and image
// optimization.
const supabaseOrigins = supabaseHostname ? [`https://${supabaseHostname}`] : [];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  [
    "connect-src 'self'",
    ...supabaseOrigins,
    ...supabaseOrigins.map((origin) => origin.replace("https://", "wss://")),
    // Turbopack's HMR socket. Dev only — never emitted in production.
    ...(isProduction ? [] : ["ws://localhost:*", "http://localhost:*"])
  ].join(" "),
  ["img-src 'self' data: blob: https://images.unsplash.com", ...supabaseOrigins].join(" "),
  ["media-src 'self' blob: https://www.soundhelix.com", ...supabaseOrigins].join(" "),
  "font-src 'self' data:",
  // Tailwind and Next inject style tags at runtime; there is no nonce path for
  // them that does not also force every route to render dynamically.
  "style-src 'self' 'unsafe-inline'",
  // 'unsafe-eval' is gone in production: nothing in this codebase calls eval or
  // new Function. React's *development* build does need it (for callstack
  // reconstruction), so it is allowed only when NODE_ENV is not production.
  //
  // 'unsafe-inline' remains because Next's App Router emits inline bootstrap
  // and RSC flight scripts. Nonce-based CSP requires reading headers() in the
  // root layout, which opts every page out of static generation. Documented as
  // accepted residual risk in SECURITY.md.
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`
].join("; ");

const noStoreAssetHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, max-age=0, must-revalidate"
  }
];

const faviconAssetRoutes = [
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-v10.ico",
  "/favicon-v10.png",
  "/favicon-v10.svg",
  "/favicon-v11.ico",
  "/favicon-v11.png",
  "/favicon-v11.svg",
  "/favicon-v12.ico",
  "/favicon-v12.png",
  "/favicon-v12.svg",
  "/apple-touch-icon.png",
  "/apple-touch-icon-v10.png",
  "/apple-touch-icon-v11.png",
  "/apple-touch-icon-v12.png",
  "/icon.png",
  "/icon-192.png",
  "/icon-192-v10.png",
  "/icon-192-v11.png",
  "/icon-192-v12.png",
  "/icon-512.png",
  "/icon-512-v10.png",
  "/icon-512-v11.png",
  "/icon-512-v12.png",
  "/brand/favicon-32x32.png",
  "/brand/favicon-48x48.png",
  "/brand/jamly-favicon.png",
  "/site.webmanifest"
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      // Only the configured project. A hardcoded ref here was an SSRF surface
      // into the image optimizer for a project this deployment may not own.
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname
            }
          ]
        : [])
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      },
      ...faviconAssetRoutes.map((source) => ({
        source,
        headers: noStoreAssetHeaders
      }))
    ];
  }
};

export default nextConfig;
