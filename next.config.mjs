import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const YEAR = 60 * 60 * 24 * 365;
const WEEK = 60 * 60 * 24 * 7;

/** Cabeceras de seguridad para todas las respuestas. */
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // SAMEORIGIN: la propia web incrusta /caja-3d.html en un iframe.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Fija la raíz del proyecto (evita que Next tome lockfiles de carpetas superiores).
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // Recursos estáticos de /public: si cambian, se cambia el nombre del archivo.
      { source: "/products/:file*", headers: [{ key: "Cache-Control", value: `public, max-age=${YEAR}, immutable` }] },
      { source: "/brand/:file*", headers: [{ key: "Cache-Control", value: `public, max-age=${YEAR}, immutable` }] },
      { source: "/:icon(icon-192.png|icon-512.png|og.jpg)", headers: [{ key: "Cache-Control", value: `public, max-age=${WEEK}` }] },
      // La caja interactiva pesa ~650 KB: caché de una semana, revalidando en segundo plano.
      // No se indexa suelta: Google la ve a través de /caja.
      {
        source: "/caja-3d.html",
        headers: [
          { key: "Cache-Control", value: `public, max-age=${WEEK}, stale-while-revalidate=${WEEK}` },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
