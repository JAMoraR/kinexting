import type { MetadataRoute } from 'next'
import { services } from '@/lib/services'

const SITE_URL = 'https://www.kinexting.com'

export default function sitemap(): MetadataRoute.Sitemap {

  return [
    ...services.map(service => ({ url: `${SITE_URL}/${service.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/waitlist`, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/sobre-nosotros`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/legal/privacidad`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/legal/terminos-de-servicio`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/legal/cancelacion-y-facturacion`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/checkout`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
