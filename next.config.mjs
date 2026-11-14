/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  async headers() {
    return [
      {
        // Background-removal model + WASM, self-hosted from public/imgly (see scripts/copy-imgly-assets.mjs).
        // Files are content-addressed, so they can be cached for a year.
        source: "/imgly/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    // onnxruntime-web ships Node-only entry points that the browser bundle never uses.
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    }
    return config;
  },
};

export default nextConfig;
