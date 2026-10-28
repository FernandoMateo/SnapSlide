import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Snap Slide — La limpieza ya no ocupa espacio",
  description: "Detergente en hojas y líquido de nueva generación. Producido y distribuido en Miami, Florida.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#00BFFF",
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
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
