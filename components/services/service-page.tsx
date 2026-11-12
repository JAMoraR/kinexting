import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle'
import StructuredData from '@/components/structured-data'
import { services, type Service } from '@/lib/services'

const site = 'https://www.kinexting.com'

function ServiceVisual({ service }: { service: Service }) {
  const media = service.media
  return (
    <figure className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
        {media?.kind === 'image' ? (
          <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        ) : media?.kind === 'video' ? (
          <video controls playsInline preload="none" poster={media.poster} className="absolute inset-0 h-full w-full object-contain" aria-label={media.caption}>
            <source src={media.src} />
            {media.tracks.map(track => <track key={track.srcLang} kind="captions" {...track} />)}
            Tu navegador no puede reproducir este video. <a href={media.src}>Descargar video</a>
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-center gap-4 p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-cyan-400">{service.visual.label}</p>
            <ol className="space-y-3">
              {service.visual.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-xl border bg-background p-3 sm:p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-cyan-950 dark:text-cyan-400">{index + 1}</span>
                  <span className="text-sm font-medium sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <figcaption className="border-t p-4 text-xs leading-relaxed text-muted-foreground">{media?.caption ?? service.visual.caption}</figcaption>
    </figure>
  )
}

export default function ServicePage({ service }: { service: Service }) {
  const url = `${site}/${service.slug}`
  const contact = `mailto:contacto@kinexting.com?subject=${encodeURIComponent(`Consulta sobre ${service.name}`)}`
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': `${site}/#organization`, name: 'Kinexting', url: site, logo: `${site}/logos/fullBlack.png` },
          { '@type': 'WebSite', '@id': `${site}/#website`, url: site, name: 'Kinexting', inLanguage: 'es-MX', publisher: { '@id': `${site}/#organization` } },
          { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: service.title, description: service.description, inLanguage: 'es-MX', isPartOf: { '@id': `${site}/#website` }, mainEntity: { '@id': `${url}#service` }, breadcrumb: { '@id': `${url}#breadcrumb` } },
          { '@type': 'Service', '@id': `${url}#service`, name: service.name, serviceType: service.name, description: service.description, url, provider: { '@id': `${site}/#organization` }, mainEntityOfPage: { '@id': `${url}#webpage` } },
          { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: site },
            { '@type': 'ListItem', position: 2, name: service.name, item: url },
          ] },
          { '@type': 'FAQPage', '@id': `${url}#faq`, isPartOf: { '@id': `${url}#webpage` }, mainEntity: service.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
        ],
      }} />
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">Ir al contenido</a>
      <header className="border-b bg-background/95">
        <div className="container flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/" aria-label="Kinexting, inicio">
            <Image src="/logos/fullBlack.png" alt="Kinexting" width={120} height={30} className="h-7 w-auto dark:hidden" priority />
            <Image src="/logos/fullWhite.png" alt="Kinexting" width={120} height={30} className="hidden h-7 w-auto dark:block" priority />
          </Link>
          <div className="flex items-center gap-4"><Link href="/#pricing" className="text-sm hover:underline">Planes</Link><ThemeToggle /></div>
          <nav aria-label="Servicios" className="flex w-full flex-wrap gap-x-5 gap-y-3 text-sm lg:order-none lg:w-auto">
            {services.map(item => <Link key={item.slug} href={`/${item.slug}`} aria-current={item.slug === service.slug ? 'page' : undefined} className={item.slug === service.slug ? 'font-semibold text-indigo-600 dark:text-cyan-400' : 'text-muted-foreground hover:text-foreground hover:underline'}>{item.name}</Link>)}
          </nav>
        </div>
      </header>
      <main id="contenido">
        <div className="container pt-6"><nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground"><ol className="flex flex-wrap gap-2"><li><Link href="/" className="hover:underline">Inicio</Link></li><li aria-hidden="true">/</li><li aria-current="page">{service.name}</li></ol></nav></div>
        <section className="container grid items-center gap-10 py-12 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="mb-4 text-sm font-semibold text-indigo-600 dark:text-cyan-400">{service.eyebrow} · {service.name}</p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{service.headline}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{service.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-auto min-h-11 whitespace-normal bg-indigo-600 py-3 text-white hover:bg-indigo-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"><a href={contact}>Cuéntanos tu proyecto <ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" /></a></Button>
              <Button asChild variant="outline" className="min-h-11"><a href="#alcance">Conocer el alcance</a></Button>
            </div>
          </div>
          <ServiceVisual service={service} />
        </section>
        <section className="border-y bg-slate-50 py-14 dark:bg-slate-950 sm:py-20" aria-labelledby="beneficios">
          <div className="container">
            <h2 id="beneficios" className="text-3xl font-bold tracking-tight">Qué aporta a tu negocio</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">{service.benefits.map(benefit => <article key={benefit.title}><CheckCircle2 aria-hidden="true" className="mb-4 h-6 w-6 text-indigo-600 dark:text-cyan-400" /><h3 className="text-xl font-semibold">{benefit.title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{benefit.description}</p></article>)}</div>
          </div>
        </section>
        <section id="alcance" className="container grid scroll-mt-6 gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div><p className="mb-3 text-sm font-semibold text-indigo-600 dark:text-cyan-400">Un ejemplo de uso</p><h2 className="text-3xl font-bold tracking-tight">{service.example.title}</h2><p className="mt-5 leading-relaxed text-muted-foreground">{service.example.description}</p></div>
          <aside className="rounded-2xl border bg-card p-6 sm:p-8"><h3 className="text-xl font-semibold">Qué revisamos antes de empezar</h3><p className="mt-4 leading-relaxed text-muted-foreground">{service.scope}</p></aside>
        </section>
        <section className="container border-t py-14 sm:py-20" aria-labelledby="proceso"><h2 id="proceso" className="text-3xl font-bold tracking-tight">Así damos forma al proyecto</h2><ol className="mt-8 grid gap-8 md:grid-cols-3">{service.process.map((step, index) => <li key={step} className="border-t pt-5"><span className="text-sm font-semibold text-indigo-600 dark:text-cyan-400">0{index + 1}</span><p className="mt-3 leading-relaxed">{step}</p></li>)}</ol></section>
        <section id="faq" className="container max-w-4xl py-10 sm:py-16" aria-labelledby="preguntas"><h2 id="preguntas" className="mb-8 text-3xl font-bold tracking-tight">Preguntas sobre {service.name.toLowerCase()}</h2>{service.faqs.map(faq => <details key={faq.question} className="group border-b py-5"><summary className="cursor-pointer text-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{faq.question}</summary><p className="mt-4 leading-relaxed text-muted-foreground">{faq.answer}</p></details>)}</section>
        <section className="container py-14 sm:py-20"><div className="rounded-2xl bg-slate-900 p-6 text-white sm:p-10"><h2 className="text-3xl font-bold tracking-tight">Empecemos por lo que necesitas resolver.</h2><p className="mt-4 max-w-2xl leading-relaxed text-slate-300">Cuéntanos cómo trabajas hoy y qué quieres mejorar. Revisaremos contigo el alcance, las herramientas necesarias y los siguientes pasos.</p><Button asChild className="mt-6 min-h-11 bg-cyan-400 text-slate-950 hover:bg-cyan-300"><a href={contact}>Consultar mi proyecto</a></Button></div></section>
        <section className="container pb-16" aria-labelledby="relacionados"><h2 id="relacionados" className="text-xl font-semibold">Explora otros servicios</h2><div className="mt-5 flex flex-wrap gap-5">{services.filter(item => item.slug !== service.slug).map(item => <Link key={item.slug} href={`/${item.slug}`} className="inline-flex items-center gap-2 text-indigo-600 underline underline-offset-4 dark:text-cyan-400">{item.name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>)}</div></section>
      </main>
      <footer className="border-t py-8"><div className="container flex flex-wrap justify-between gap-5 text-sm text-muted-foreground"><p>Kinexting · Soluciones digitales para tu negocio</p><nav aria-label="Información legal" className="flex flex-wrap gap-5"><Link href="/sobre-nosotros" className="hover:underline">Sobre nosotros</Link><Link href="/legal/privacidad" className="hover:underline">Privacidad</Link><Link href="/legal/terminos-de-servicio" className="hover:underline">Términos de servicio</Link></nav></div></footer>
    </div>
  )
}
