import type { Metadata } from 'next'

export type ServiceMedia =
  | { kind: 'image'; src: string; alt: string; caption: string }
  | { kind: 'video'; src: string; poster: string; caption: string; tracks: { src: string; srcLang: string; label: string }[] }

export type Service = {
  slug: string
  name: string
  title: string
  description: string
  eyebrow: string
  headline: string
  intro: string
  visual: { label: string; steps: [string, string, string]; caption: string }
  media?: ServiceMedia
  benefits: { title: string; description: string }[]
  example: { title: string; description: string }
  scope: string
  process: string[]
  faqs: { question: string; answer: string }[]
}

export const services: Service[] = [
  {
    slug: 'chatbot-whatsapp-ia',
    name: 'Chatbot de WhatsApp con IA',
    title: 'Chatbot para WhatsApp con inteligencia artificial | Kinexting',
    description: 'Atiende preguntas frecuentes, reúne datos de prospectos y organiza el seguimiento con un chatbot de WhatsApp con IA adaptado a tu negocio.',
    eyebrow: 'Atención y seguimiento',
    headline: 'Cada conversación puede ser el inicio de una venta.',
    intro: 'Ayuda a tus clientes a encontrar respuestas en WhatsApp y entrega a tu equipo la información que necesita para continuar la atención. Diseñamos el asistente alrededor de tus servicios, horarios y forma de trabajar.',
    visual: { label: 'Una conversación, un siguiente paso', steps: ['El cliente pregunta', 'La IA orienta y reúne datos', 'Tu equipo continúa la atención'], caption: 'Flujo ilustrativo de atención. Las respuestas y acciones se definen durante la configuración.' },
    benefits: [
      { title: 'Respuestas con contexto', description: 'Organiza preguntas frecuentes, horarios, servicios y condiciones para que el asistente pueda orientar con información aprobada por tu negocio.' },
      { title: 'Prospectos mejor preparados', description: 'Solicita los datos necesarios para identificar el servicio de interés y facilitar el seguimiento comercial, sin repetir toda la conversación.' },
      { title: 'Una salida hacia tu equipo', description: 'Define cuándo derivar una consulta a una persona: solicitudes especiales, dudas sin respuesta o situaciones que requieren criterio humano.' },
    ],
    example: { title: 'De una pregunta a una solicitud de cita', description: 'Una persona consulta por un servicio fuera de tu horario. El asistente explica la información disponible y reúne su nombre y preferencia de horario. Si el proyecto incluye una integración de agenda, se define cómo consultar disponibilidad y confirmar la cita; en otros casos, tu equipo recibe la solicitud para continuar.' },
    scope: 'Revisamos tu número de WhatsApp, los requisitos del canal y las herramientas que ya utilizas. La conexión con agenda o CRM, los costos del canal y el alcance de las respuestas se confirman antes de contratar. La IA puede equivocarse: conviene revisar las conversaciones y mantener actualizada su información.',
    process: ['Reunimos tus preguntas frecuentes y definimos qué puede responder el asistente.', 'Configuramos el flujo, los datos que solicitará y los criterios de atención humana.', 'Probamos conversaciones reales contigo y acordamos los ajustes y el seguimiento.'],
    faqs: [
      { question: '¿Puedo usar mi número actual de WhatsApp?', answer: 'Primero revisamos su configuración y compatibilidad con la conexión prevista. Antes de cualquier cambio te explicamos los requisitos y el posible impacto en tu operación.' },
      { question: '¿El chatbot puede agendar citas?', answer: 'Puede reunir solicitudes de cita. La consulta de disponibilidad y la confirmación automática dependen de la agenda y de las integraciones incluidas en el proyecto.' },
      { question: '¿Qué pasa si no sabe responder?', answer: 'Definimos un mensaje de salida y un mecanismo de derivación a tu equipo. También delimitamos qué temas puede atender y qué información necesita confirmar una persona.' },
    ],
  },
  {
    slug: 'desarrollo-web', name: 'Desarrollo web',
    title: 'Desarrollo web para negocios y profesionales | Kinexting',
    description: 'Sitios web claros, adaptables a móviles y preparados para crecer. Presenta tus servicios y facilita que tus visitantes contacten a tu negocio.',
    eyebrow: 'Tu presencia digital', headline: 'Una web que explica tu valor y facilita el contacto.',
    intro: 'Convertimos la información de tu negocio en una experiencia clara: qué ofreces, para quién y cómo dar el siguiente paso. Desde una página de presentación hasta un sitio con secciones e integraciones definidas a tu medida.',
    visual: { label: 'Un recorrido pensado para tus visitantes', steps: ['Descubre tu propuesta', 'Explora tus servicios', 'Contacta a tu negocio'], caption: 'Recorrido ilustrativo. El diseño final se adapta al contenido y a los objetivos de tu proyecto.' },
    benefits: [
      { title: 'Contenido que orienta', description: 'Estructuramos tus servicios, preguntas frecuentes y llamadas a la acción para que cada página responda a una intención concreta.' },
      { title: 'Una experiencia adaptable', description: 'Diseñamos para móviles y escritorio, con navegación clara y espacios estables para fotografías, capturas y videos.' },
      { title: 'Bases para ser encontrado', description: 'Incluimos una estructura semántica, metadatos por página y bases técnicas de indexación. El posicionamiento también depende de tu contenido y de la competencia.' },
    ],
    example: { title: 'Un sitio para un negocio de servicios', description: 'Una persona llega buscando una solución concreta. Encuentra una página que explica el servicio, sus alcances y las dudas habituales, y puede solicitar información. Más adelante puedes incorporar fotos del trabajo, videos explicativos o nuevas páginas sin reorganizar todo el sitio.' },
    scope: 'Antes de empezar acordamos páginas, contenidos, dominio, alojamiento y mantenimiento. Formularios, catálogos, pagos, reservas o conexiones con otras herramientas se cotizan según los requisitos; no se asumen incluidos en todos los sitios.',
    process: ['Definimos el objetivo, las páginas y el material que necesita tu sitio.', 'Preparamos la estructura y el diseño adaptable para revisar contigo.', 'Implementamos, verificamos navegación y contenido, y acordamos publicación y mantenimiento.'],
    faqs: [
      { question: '¿Puedo agregar fotos y videos después?', answer: 'Sí. Se reservan módulos con proporciones definidas para incorporar material visual conservando la estructura. Conviene preparar imágenes optimizadas y videos con portada y subtítulos.' },
      { question: '¿El sitio incluye dominio y alojamiento?', answer: 'Se especifica en la propuesta. Revisamos si ya cuentas con estos servicios o si necesitas contratarlos, junto con sus costos de renovación y responsabilidades de mantenimiento.' },
      { question: '¿Se puede conectar con WhatsApp o un CRM?', answer: 'Sí, sujeto al alcance y a la compatibilidad de las herramientas. Un enlace de contacto, un formulario y una integración de datos tienen requisitos diferentes que revisamos contigo.' },
    ],
  },
  {
    slug: 'automatizacion-negocios', name: 'Automatización de negocios',
    title: 'Automatización de procesos para negocios | Kinexting',
    description: 'Conecta herramientas y reduce tareas repetitivas en tu negocio. Diseñamos flujos de seguimiento y gestión con reglas, controles y alcance definidos.',
    eyebrow: 'Procesos conectados', headline: 'Menos tareas repetidas. Más tiempo para tu negocio.',
    intro: 'Identificamos dónde se repite trabajo y diseñamos flujos para mover información entre tus herramientas. Empezamos por un proceso concreto, con reglas claras y un resultado que puedas comprobar.',
    visual: { label: 'Del trabajo manual a un flujo conectado', steps: ['Se recibe una solicitud', 'Se organiza la información', 'Se activa el seguimiento'], caption: 'Flujo ilustrativo. Las conexiones dependen de las herramientas y permisos disponibles.' },
    benefits: [
      { title: 'Información sin recapturas', description: 'Evaluamos cómo trasladar datos desde formularios o canales de atención hacia un CRM u otra herramienta, evitando copiar la misma información varias veces.' },
      { title: 'Seguimiento con reglas', description: 'Define responsables, avisos y próximos pasos para que las solicitudes sigan un proceso acordado y tu equipo sepa cuándo intervenir.' },
      { title: 'Control de excepciones', description: 'Diseñamos validaciones y rutas de revisión para datos incompletos o fallos de conexión. Las acciones sensibles pueden requerir aprobación humana.' },
    ],
    example: { title: 'De un formulario al seguimiento comercial', description: 'Al recibir una solicitud, el flujo valida los campos necesarios, registra el contacto en la herramienta acordada y avisa al responsable. Si falta información o una conexión falla, se define cómo detectar el problema y retomar el proceso sin perder la solicitud.' },
    scope: 'La viabilidad depende de las APIs, permisos y límites de cada herramienta. Acordamos integraciones, volumen esperado, costos de terceros y mantenimiento. Las funciones del futuro Plan gestor se presentan por separado en su lista de espera y no se consideran disponibles por contratar una automatización.',
    process: ['Documentamos un proceso actual y elegimos qué resultado queremos mejorar.', 'Revisamos herramientas, permisos, reglas y posibles excepciones.', 'Probamos el flujo con casos habituales y errores, y definimos responsables y mantenimiento.'],
    faqs: [
      { question: '¿Qué proceso conviene automatizar primero?', answer: 'Uno repetitivo, con reglas claras y datos disponibles: registrar solicitudes, avisar a un responsable o preparar un seguimiento. Revisamos su frecuencia y el esfuerzo que requiere antes de proponer una solución.' },
      { question: '¿Pueden conectar las herramientas que ya uso?', answer: 'Primero verificamos si ofrecen una API, webhooks o un método de integración compatible. Algunos servicios requieren planes de pago o permisos adicionales.' },
      { question: '¿Toda automatización necesita inteligencia artificial?', answer: 'No. Muchos procesos se resuelven con reglas y validaciones. La IA se evalúa cuando hace falta interpretar texto u otra información variable, con controles acordes a la tarea.' },
    ],
  },
]

export function serviceMetadata(service: Service): Metadata {
  return {
    title: service.title, description: service.description,
    alternates: { canonical: `/${service.slug}` },
    openGraph: { title: service.title, description: service.description, url: `/${service.slug}`, siteName: 'Kinexting', locale: 'es_MX', type: 'website', images: [{ url: '/og-social.png', width: 1200, height: 630, alt: service.name + ' | Kinexting' }] },
    twitter: { card: 'summary_large_image', title: service.title, description: service.description, images: ['/og-social.png'] },
  }
}
