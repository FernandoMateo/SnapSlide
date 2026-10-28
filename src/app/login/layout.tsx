import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Vendedores",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
