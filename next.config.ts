import type { NextConfig } from "next";

// Ensure NextAuth uses dynamic host detection (mobile IP, Vercel, localhost)
delete process.env.NEXTAUTH_URL;
delete process.env.AUTH_URL;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.29.53",
    "192.168.29.53:3000",
    "localhost",
    "localhost:3000",
  ],
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
