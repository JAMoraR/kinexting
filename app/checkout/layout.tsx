import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout | Kinexting',
  description:
    'Contrata tu plan de hosting, web o chatbot en Kinexting de forma segura y personaliza los extras para tu negocio.',
  alternates: {
    canonical: '/checkout',
  },
  openGraph: {
    title: 'Checkout | Kinexting',
    description:
      'Contrata tu plan de hosting, web o chatbot en Kinexting de forma segura y personaliza los extras para tu negocio.',
    url: 'https://www.kinexting.com/checkout',
    siteName: 'Kinexting',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Checkout | Kinexting',
    description:
      'Contrata tu plan de hosting, web o chatbot en Kinexting de forma segura y personaliza los extras para tu negocio.',
  },
}

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
