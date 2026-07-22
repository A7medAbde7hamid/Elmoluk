import { Helmet } from "react-helmet-async";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "صالون الملوك",
  alternateName: "El Moluok Salon",
  description: "أفضل صالون حلاقة رجالي في العاشر من رمضان. نقدم خدمات الحلاقة، العناية بالبشرة، منتجات العناية، وباقات ملكية.",
  url: "https://elmoluk.vercel.app",
  telephone: "+20 1097314558",
  email: "info@elmoluk.com",
  image: "https://elmoluk.vercel.app/og-image.svg",
  logo: "https://elmoluk.vercel.app/icons/icon.svg",
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
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "10:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "16:00", closes: "20:00" },
  ],
  priceRange: "$$",
  paymentAccepted: ["Cash", "Card", "Vodafone Cash"],
  areaServed: ["العاشر من رمضان", "الشرقية", "بلبيس", "الصالحية الجديدة"],
  sameAs: [
    "https://wa.me/201097314558",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "خدمات الحلاقة والعناية",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "حلاقة كاملة" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "تهذيب لحية" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "عناية بالبشرة" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "حمام بخار" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "صبغ شعر" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "خدمة منزلية" } },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "150",
    bestRating: "5",
  },
};

export default function JSONLD() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
