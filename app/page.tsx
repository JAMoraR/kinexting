import HomePage from '@/components/home-page'
import StructuredData from '@/components/structured-data'

export default function Home() {
  return <>
    <StructuredData data={{
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': 'https://www.kinexting.com/#organization', name: 'Kinexting', url: 'https://www.kinexting.com', logo: 'https://www.kinexting.com/logos/fullBlack.png' },
        { '@type': 'WebSite', '@id': 'https://www.kinexting.com/#website', url: 'https://www.kinexting.com', name: 'Kinexting', inLanguage: 'es-MX', publisher: { '@id': 'https://www.kinexting.com/#organization' } },
        { '@type': 'WebPage', '@id': 'https://www.kinexting.com/#webpage', url: 'https://www.kinexting.com', name: 'WhatsApp con IA, CRM y páginas web | Kinexting', isPartOf: { '@id': 'https://www.kinexting.com/#website' }, about: { '@id': 'https://www.kinexting.com/#organization' }, inLanguage: 'es-MX' },
      ],
    }} />
    <HomePage />
  </>
}
