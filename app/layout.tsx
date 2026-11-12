import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://kinexting.com'),
  title: 'WhatsApp con IA, CRM y páginas web | Kinexting',
  alternates: {
    canonical: '/',
  },
  keywords: 'Kinexting, digitalización, negocio, crecimiento',
  authors: [
    {
      name: 'Kinexting',
      url: 'https://kinexting.com',
    },
  ],
  creator: 'Kinexting',
  publisher: 'Kinexting',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'fb:app_id': '894860623358242',
  },
  // Open Graph
  openGraph: {
    title: 'WhatsApp con IA, CRM y páginas web | Kinexting',
    description: 'WhatsApp con IA, CRM y soluciones web para tu negocio. Conoce los planes de Kinexting y el próximo Plan gestor.',
    url: 'https://kinexting.com',
    siteName: 'Kinexting',
    images: [
      {
        url: 'https://kinexting.com/og-social.png',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
      {
        url: 'https://kinexting.com/og-social.jpg',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp con IA, CRM y páginas web | Kinexting',
    description: 'WhatsApp con IA, CRM y soluciones web para tu negocio. Conoce los planes de Kinexting y el próximo Plan gestor.',
    images: [
      {
        url: 'https://kinexting.com/og-social.png',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
      {
        url: 'https://kinexting.com/og-social.jpg',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
    ],
    creator: '@kinexting',
    site: '@kinexting',
  },
  icons: {
    icon: '/favicon.png',
  },
  description: 'Automatiza la atención de tu negocio con WhatsApp e IA, CRM y soluciones web. Conoce los planes de Kinexting y la lista de espera del Plan gestor.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <Analytics />
      <body className="overflow-x-hidden antialiased selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:bg-cyan-500/20 dark:selection:text-cyan-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
