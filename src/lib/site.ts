/**
 * Datos públicos del sitio para SEO (metadatos, sitemap, robots, JSON-LD).
 * En producción define NEXT_PUBLIC_SITE_URL con el dominio real (https://…, sin barra final).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE = {
  name: "Snap Slide",
  title: "Snap Slide · Detergente en hojas | Laundry Detergent Sheets Miami",
  description:
    "Detergente en hojas Snap Slide: 32 hojas, 64 lavados en una caja que cabe en una mano. Aromas Original Soft Sent y Floral Fantasy. Producido y distribuido en Miami, Florida.",
  keywords: [
    "detergente en hojas",
    "hojas de detergente",
    "laundry detergent sheets",
    "detergent sheets Miami",
    "detergente ecológico",
    "eco friendly laundry",
    "Snap Slide",
    "Floral Fantasy",
    "Original Soft Sent",
    "distribuidor detergente Miami",
  ],
  locale: "es_US",
  city: "Miami",
  region: "FL",
  country: "US",
  themeColor: "#00BFFF",
};
