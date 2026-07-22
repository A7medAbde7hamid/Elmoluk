import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_URL = "https://elmoluk.vercel.app";

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "weekly", lastmod: "2026-07-22" },
  { loc: "/services", priority: "0.9", changefreq: "monthly", lastmod: "2026-07-22" },
  { loc: "/barbers", priority: "0.8", changefreq: "monthly", lastmod: "2026-07-22" },
  { loc: "/packages", priority: "0.8", changefreq: "monthly", lastmod: "2026-07-22" },
  { loc: "/booking", priority: "0.9", changefreq: "weekly", lastmod: "2026-07-22" },
  { loc: "/shop", priority: "0.7", changefreq: "weekly", lastmod: "2026-07-22" },
  { loc: "/offers", priority: "0.7", changefreq: "weekly", lastmod: "2026-07-22" },
  { loc: "/contact", priority: "0.6", changefreq: "monthly", lastmod: "2026-07-22" },
  { loc: "/login", priority: "0.3", changefreq: "monthly", lastmod: "2026-07-22" },
];

function urlXml(page: typeof staticPages[0]) {
  return `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const urls = staticPages.map(urlXml).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(sitemap);
}
