import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configura tu plan | Kinexting',
  description:
    'Configura tu plan de hosting, web o chatbot en Kinexting y personaliza extras para tu negocio.',
  alternates: {
    canonical: '/configurar-plan',
  },
  openGraph: {
    title: 'Configura tu plan | Kinexting',
    description:
      'Personaliza tu plan de hosting, web o chatbot y calcula el costo final en segundos.',
    url: 'https://kinexting.com/configurar-plan',
    siteName: 'Kinexting',
    locale: 'es-ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configura tu plan | Kinexting',
    description:
      'Personaliza tu plan de hosting, web o chatbot y calcula el costo final en segundos.',
  },
}

export default function ConfigurarPlanLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
