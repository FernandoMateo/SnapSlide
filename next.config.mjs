import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fija la raíz del proyecto (evita que Next tome lockfiles de carpetas superiores).
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
