import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/onboarding',
          '/api',
          '/auth',
          '/editor',
          '/teste',
          '/preview',
          '/test',
        ],
      },
    ],
    sitemap: 'https://syncpost.com.br/sitemap.xml',
  }
}
