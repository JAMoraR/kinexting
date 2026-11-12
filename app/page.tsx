import HomePage from '@/components/home-page'
import StructuredData from '@/components/structured-data'

export default function Home() {
  return <>
    <StructuredData data={{
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': 'https://kinexting.com/#organization', name: 'Kinexting', url: 'https://kinexting.com', logo: 'https://kinexting.com/logos/fullBlack.png' },
        { '@type': 'WebSite', '@id': 'https://kinexting.com/#website', url: 'https://kinexting.com', name: 'Kinexting', inLanguage: 'es-MX', publisher: { '@id': 'https://kinexting.com/#organization' } },
        { '@type': 'WebPage', '@id': 'https://kinexting.com/#webpage', url: 'https://kinexting.com', name: 'WhatsApp con IA, CRM y páginas web | Kinexting', isPartOf: { '@id': 'https://kinexting.com/#website' }, about: { '@id': 'https://kinexting.com/#organization' }, inLanguage: 'es-MX' },
      ],
    }} />
    <HomePage />
  </>
}
