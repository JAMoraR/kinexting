# Páginas públicas de servicios

Las rutas `/chatbot-whatsapp-ia`, `/desarrollo-web` y `/automatizacion-negocios` renderizan contenido en el servidor con una plantilla común (`components/services/service-page.tsx`). El contenido, las preguntas frecuentes y los metadatos están en `lib/services.ts`. Cada página incluye canonical, Open Graph, Twitter y JSON-LD de Service, WebPage, BreadcrumbList y FAQPage. Las preguntas visibles y las estructuradas usan la misma fuente.

## Incorporar fotos o videos

Cada servicio admite un campo opcional `media`. Sin ese campo, el módulo visual muestra un flujo ilustrativo del servicio. Al agregar contenido multimedia, se conserva el contenedor 4:3, el pie de figura y la posición dentro del hero; no hace falta cambiar la plantilla.

Foto (archivo en `public/servicios/`):

```ts
media: {
  kind: 'image',
  src: '/servicios/equipo.webp',
  alt: 'Descripción concreta de lo que muestra la fotografía',
  caption: 'Contexto de la fotografía.',
},
```

Video:

```ts
media: {
  kind: 'video',
  src: '/servicios/demostracion.mp4',
  poster: '/servicios/demostracion.webp',
  caption: 'Demostración del proceso de atención.',
  tracks: [{ src: '/servicios/demostracion-es.vtt', srcLang: 'es', label: 'Español' }],
},
```

Optimizar los archivos antes de publicarlos. Las fotos se recortan con `object-cover`; usar encuadres que toleren una proporción 4:3. El video conserva su encuadre con `object-contain`, controles nativos, portada, sin reproducción automática y sin precarga del archivo. Incluir subtítulos y, cuando haga falta para comprender el contenido visual, una alternativa descriptiva. Para imágenes remotas, configurar explícitamente el proveedor permitido en Next Image.

Los recursos multimedia no generan automáticamente datos estructurados de VideoObject: incorporarlos cuando existan los datos reales de publicación, duración y contenido. No se publican reseñas, precios ni resultados comerciales ficticios.
