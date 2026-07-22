import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  keywords?: string;
}

const BASE_URL = "https://elmoluk.vercel.app";
const SITE_NAME = "صالون الملوك | El Moluok Salon";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.svg`;
const DEFAULT_KEYWORDS = "صالون حلاقة, حلاق, العاشر من رمضان, حلاقة رجالي, عناية بالرجال, صالون الملوك, El Moluok, حلاقين, تهذيب لحية, عناية بالبشرة, منتجات شعر, باقات حلاقة";

export default function SEO({ title, description, path = "", ogImage, keywords }: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || DEFAULT_KEYWORDS} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="ar_EG" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="alternate" hrefLang="ar" href={url} />
      <link rel="alternate" hrefLang="x-default" href={BASE_URL} />
    </Helmet>
  );
}
