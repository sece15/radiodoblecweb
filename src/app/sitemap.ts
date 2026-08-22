import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://radiodoblec.com";
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/horarios`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
