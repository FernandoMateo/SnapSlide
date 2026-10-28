import type { Metadata } from "next";

const description = "Gira la caja Snap Slide, tira de la pestaña, saca una hoja y mira cómo se disuelve. Original Soft Sent y Floral Fantasy.";

export const metadata: Metadata = {
  title: "Caja 3D interactiva",
  description,
  alternates: { canonical: "/caja" },
  openGraph: {
    url: "/caja",
    title: "Caja 3D interactiva · Snap Slide",
    description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Snap Slide · Laundry Detergent Sheets" }],
  },
};

export default function BoxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
