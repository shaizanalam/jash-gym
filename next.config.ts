import type { NextConfig } from "next";

// Ensure NextAuth uses dynamic host detection (mobile IP, Vercel, localhost)
delete process.env.NEXTAUTH_URL;
delete process.env.AUTH_URL;

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  ...(isCapacitorBuild
    ? {
        output: "export" as const,
        images: {
          unoptimized: true,
        },
      }
    : {
        outputFileTracingIncludes: {
          "/**": ["./prisma/**/*"],
        },
      }),
  allowedDevOrigins: [
    "192.168.29.53",
    "192.168.29.53:3000",
    "localhost",
    "localhost:3000",
  ],
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
