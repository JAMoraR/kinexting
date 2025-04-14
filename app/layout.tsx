import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
  keywords: 'Kinexting, digitalización, negocio, crecimiento',
  authors: [
    {
      name: 'Kinexting',
      url: 'https://kinexting.com',
    },
  ],
  creator: 'Kinexting',
  publisher: 'Kinexting',
  // Open Graph
  /*openGraph: {
    title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
    description: 'Kinexting es una plataforma que te ayuda a digitalizar tu negocio y a impulsar tu crecimiento.',
    url: 'https://kinexting.com',
    siteName: 'Kinexting',
    images: [
      {
        url: 'https://kinexting.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
    ],
    locale: 'es-ES',
    type: 'website',
  },*/
  // Twitter Card
  /*twitter: {
    card: 'summary_large_image',
    title: 'Kinexting | Digitaliza tu negocio e impulsa tu crecimiento',
    description: 'Kinexting es una plataforma que te ayuda a digitalizar tu negocio y a impulsar tu crecimiento.',
    images: [
      {
        url: 'https://kinexting.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kinexting',
      },
    ],
    creator: '@kinexting',
    site: '@kinexting',
  },*/
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
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
