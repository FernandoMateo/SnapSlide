import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: SITE.locale,
    alternateLocale: ["en_US"],
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Snap Slide · Laundry Detergent Sheets" }],
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description, images: ["/og.jpg"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca la intro como vista antes del primer pintado para evitar un destello del overlay. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("snapslide-intro-seen"))document.documentElement.classList.add("intro-seen")}catch(e){}`,
          }}
        />
        <JsonLd />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
