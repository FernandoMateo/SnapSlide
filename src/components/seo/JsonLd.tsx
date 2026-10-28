import { SITE, SITE_URL } from "@/lib/site";

/** Datos estructurados (schema.org) para que Google entienda la marca y sus productos. */
export function JsonLd() {
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: SITE.name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og.jpg`,
    address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
    areaServed: { "@type": "City", name: "Miami" },
  };
  const product = (name: string, image: string) => ({
    "@type": "Product",
    name: `${SITE.name} Laundry Detergent Sheets · ${name}`,
    description: "32 hojas de detergente, 64 lavados. Corta la hoja en la marca para cargas pequeñas.",
    image: `${SITE_URL}${image}`,
    brand: { "@type": "Brand", name: SITE.name },
    manufacturer: { "@id": `${SITE_URL}/#org` },
    category: "Laundry Detergent",
  });
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      org,
      { "@type": "WebSite", "@id": `${SITE_URL}/#web`, url: SITE_URL, name: SITE.name, inLanguage: ["es", "en"], publisher: { "@id": `${SITE_URL}/#org` } },
      product("Original Soft Sent", "/products/box-original.webp"),
      product("Floral Fantasy", "/products/box-floral.webp"),
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
