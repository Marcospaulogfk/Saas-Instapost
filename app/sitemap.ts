import type { MetadataRoute } from 'next'
import { NICHOS } from '@/lib/seo/nichos'

const BASE_URL = 'https://nexuscontentai.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // /cadastro e /login saem do sitemap: o middleware redireciona esses
    // paths do apex pro subdominio do app (307), entao aqui eles so
    // apontavam pra um redirect. Pagina de autenticacao nao precisa indexar.
    {
      url: `${BASE_URL}/termos`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacidade`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/modelos/carrossel`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...NICHOS.map((nicho) => ({
      url: `${BASE_URL}/modelos/carrossel/${nicho.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
