import { Helmet } from "react-helmet-async";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "صالون الملوك",
  alternateName: "El Moluok Salon",
  description: "أفضل صالون حلاقة رجالي في العاشر من رمضان. نقدم خدمات الحلاقة، العناية بالبشرة، منتجات العناية، وباقات ملكية.",
  url: "https://elmoluk.vercel.app",
  telephone: "+20 1097314558",
  email: "",
  image: "https://elmoluk.vercel.app/og-image.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress: "العاشر من رمضان - الحي العاشر 110 بجوار مستشفي العزل - خلف صيدليه احمد عبدالعال",
    addressLocality: "العاشر من رمضان",
    addressRegion: "الشرقية",
    addressCountry: "EG",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.3169,
    longitude: 31.7437,
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "21:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "21:00" },
  ],
  priceRange: "$$",
  paymentAccepted: ["Cash", "Card", "Vodafone Cash"],
  areaServed: "العاشر من رمضان",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "خدمات الحلاقة",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "حلاقة كاملة" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "تهذيب لحية" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "عناية بالبشرة" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "بخار" } },
    ],
  },
};

export default function JSONLD() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
