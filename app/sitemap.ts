import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/browse`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/map`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/lost/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/found/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
