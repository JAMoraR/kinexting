# SEO, AEO y GEO de Kinexting

## Objetivo y alcance

Captar búsquedas de negocios de servicios que necesitan atención por WhatsApp, agenda, CRM y presencia web. El primer resultado es un objetivo comercial, no una garantía técnica. Esta implementación no demuestra mejoras de ranking: se necesita publicar, indexar y medir.

## Mapa inicial de intención (hipótesis, sin datos de volumen)

| URL | Intención principal | Temas relacionados |
| --- | --- | --- |
| / | WhatsApp con IA y CRM para negocios | chatbot, automatización de atención, soluciones web |
| /waitlist | asistente de WhatsApp con IA y agenda automática | CRM de prospectos, página web y catálogo, cobros y suscripciones, validador de ideas |
| /configurar-plan | configurar y contratar un plan Kinexting | opciones y extras de los planes actuales |

Validar estas hipótesis con consultas reales en Search Console. No crear seis páginas casi iguales para repetir palabras clave. Publicar páginas independientes cuando haya información suficiente sobre funcionamiento, requisitos, límites y ejemplos originales de cada herramienta.

## Cambios implementados

- Waitlist indexable con título, descripción, canonical y tarjetas sociales específicos.
- Sitemap con el mismo dominio que los canonical y con la waitlist incluida. Se eliminaron fechas de actualización generadas en cada petición: no representaban cambios de contenido.
- Landing con enlace rastreable a la waitlist y resumen visible del plan en preparación.
- Preguntas y respuestas públicas sobre las seis funciones, disponibilidad y beneficio de registro. No se presentan como funciones ya lanzadas.
- Datos estructurados Organization, WebSite y WebPage; descripción del servicio futuro sin precios, reseñas ni disponibilidad inventados.
- Contenedor de inicio en servidor para emitir sus datos estructurados; se conserva el componente interactivo.

## Al publicar

1. Verificar que https://kinexting.com sea el dominio final en Vercel. Configurar la redirección permanente desde www si todavía no existe; comprobar que todas las variantes HTTP/HTTPS y www converjan en un único destino sin bucles.
2. Inspeccionar / y /waitlist en Search Console, probar la URL publicada y solicitar indexación. Enviar /sitemap.xml a Google Search Console y Bing Webmaster Tools.
3. Comprobar código HTTP 200, canonical, ausencia de X-Robots-Tag noindex y acceso de los rastreadores en CDN/WAF. robots.txt permite el rastreo público; esto no garantiza indexación. No hace falta habilitar rastreadores de entrenamiento para aparecer en respuestas de búsqueda.
4. Validar JSON-LD con Schema Markup Validator. No se espera un resultado enriquecido por estos tipos ni se promete por las preguntas frecuentes.
5. Medir Core Web Vitals en móvil con datos de campo. Revisar especialmente las animaciones del inicio y el contenido inicialmente transparente; comprobar legibilidad con JavaScript desactivado como mejora posterior.
6. Registrar como conversión únicamente un envío confirmado de la waitlist. Nunca enviar teléfonos, correos o nombres a herramientas de analítica.

## Medición

Guardar una línea base antes de publicar y revisar cada 28 días: impresiones, clics, CTR, posición por consulta y página, y registros confirmados de la waitlist. Separar consultas de marca de búsquedas de categoría.

Probar mensualmente un conjunto estable de consultas en buscadores y asistentes: “asistente de WhatsApp con IA para negocios de servicios”, “agenda automática de citas por WhatsApp”, “CRM para prospectos de WhatsApp”, “página web con catálogo y chat”, “cobros y suscripciones para servicios” y “validador de ideas de negocio”. Registrar fecha, país, consulta, plataforma, URL citada y competidores; las respuestas varían y una prueba aislada no representa un ranking estable.

## Contenido y autoridad pendientes

- Publicar demostraciones reales, requisitos de conexión, integraciones confirmadas y precios cuando estén disponibles.
- Crear guías originales para los sectores atendidos, apoyadas en ejemplos de uso verificables.
- Publicar metodología y fuentes del validador cuando se definan; no prometer éxito de mercado.
- Obtener testimonios y casos de uso con permiso y evidencia. No inventar métricas ni reseñas.
- Mantener información de empresa, contacto y condiciones coherentes. Buscar menciones editoriales y perfiles legítimos cuando el producto sea elegible.

## Fuentes oficiales

- Google: https://developers.google.com/search/docs/appearance/ai-features
- Google: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

Google mantiene los fundamentos de SEO para sus experiencias de IA: contenido útil, indexable, enlaces internos y datos estructurados coherentes con el contenido visible. No exige archivos de IA ni marcado especial para AEO/GEO.
