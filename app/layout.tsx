import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  metadataBase: new URL('https://kinexting.com'),
  title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
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
    title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
    description: 'Kinexting es una plataforma que te ayuda a digitalizar tu negocio y a impulsar tu crecimiento.',
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
    locale: 'es-ES',
    type: 'website',
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
    description: 'Kinexting es una plataforma que te ayuda a digitalizar tu negocio y a impulsar tu crecimiento.',
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
  /*icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    other: {
      favicons: [
        {
          url: '/favicon-16x16.png',
          sizes: '16x16',
        },
      ],
    },
  },*/
  description: 'Kinexting es una plataforma que te ayuda a digitalizar tu negocio y a impulsar tu crecimiento a través de la tecnología y la innovación digital.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
