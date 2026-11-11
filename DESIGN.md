---
name: Kinexting
description: Plataforma B2B de automatización con agentes de IA (WhatsApp y Redes Sociales) y CRM Todo-en-Uno para negocios de servicios
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  cyber-cyan: "#38bdf8"
  cyber-cyan-bright: "#22d3ee"
  cyber-cyan-hover: "#0284c7"
  obsidian-bg: "#060c18"
  obsidian-card: "#0f172a"
  obsidian-surface: "#111827"
  pure-white: "#ffffff"
  light-surface: "#f8fafc"
  light-card: "#ffffff"
  text-light-primary: "#020817"
  text-light-muted: "#64748b"
  text-dark-primary: "#e2e8f0"
  text-dark-muted: "#94a3b8"
  border-light: "#e2e8f0"
  border-dark: "#334155"
  accent-purple: "#7c3aed"
  accent-emerald: "#10b981"
  destructive: "#ef4444"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-cyan:
    backgroundColor: "{colors.cyber-cyan}"
    textColor: "{colors.obsidian-bg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  button-cyan-hover:
    backgroundColor: "{colors.cyber-cyan-bright}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "40px"
  badge-pill:
    backgroundColor: "rgba(79, 70, 229, 0.1)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  card-default:
    backgroundColor: "{colors.light-card}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: Kinexting

## Overview

**Creative North Star: "Cybernetic Kinetic Command"**

Kinexting es una plataforma tecnológica B2B de alto rendimiento que combina automatización conversacional mediante agentes autónomos de Inteligencia Artificial (WhatsApp y redes sociales) con un sistema centralizado de gestión operativa CRM. Su lenguaje visual transmite precisión técnica, inmediatez y solvencia corporativa: una cabina de mando sobria y fluida donde negocios de servicios resuelven la captación y operación de sus clientes sin fricción.

El sistema se estructura sobre un lienzo nocturno de obsidiana profunda (`#060c18`) iluminado por sutiles gradientes radiales y acentos cromáticos de alta energía: índigo eléctrico (`#4f46e5`) para afirmar autoridad institucional y cian reactivo (`#38bdf8`) para enfocar la mirada en decisiones críticas de conversión y estado en tiempo real. En modo claro, la interfaz evoluciona hacia una estética nítida y editorial con blancos puros (`#ffffff`), grises pizarra fríos y bordes sutilmente delineados (`#e2e8f0`).

Se rechaza categóricamente el desorden visual, las tarjetas homogéneas repetitivas tipo plantilla genérica, los gradientes multicolores estridentes sobre párrafos de texto y las sombras duras de bloque sin desenfoque (neobrutalismo fuera de lugar). Toda superficie tiene un rol de jerarquía claro, con microinteracciones táctiles ágiles (200ms) que recompensan al usuario sin ralentizar la toma de decisiones.

**Key Characteristics:**
- **Lienzo Bicolor Adaptativo:** Autoridad sobria y pulcra en modo claro; atmósfera inmersiva tipo consola cibernética en modo oscuro.
- **Jerarquía Guiada por Tensión Cromática:** Fondos oscuros de baja saturación combinados con destellos calculados de cian y zafiro.
- **Modularidad Asimétrica:** Grillas tipo Bento y paneles analíticos que reflejan variedad funcional en lugar de mosaicos repetitivos.
- **Micro-Respuestas Táctiles:** Elevaciones elásticas en hover (`-translate-y-0.5`), desenfoques de vidrio en barras de navegación y retroalimentación de estado visible en menos de 200ms.

## Colors

La paleta cromática de Kinexting equilibra la solvencia institucional del azul e índigo con la agilidad eléctrica del cian y la profundidad de la obsidiana.

### Primary
- **Electric Indigo** (`#4f46e5`): El color ancla de la marca. Utilizado en botones de acción principal en modo claro, enlaces interactivos, logotipos y estados activos institucionales. Transmite solidez y madurez tecnológica.
- **Electric Indigo Hover** (`#4338ca`): Estado de interacción y presión para controles primarios en modo claro.
- **Reactive Cyber Cyan** (`#38bdf8`): Acento de alta reflectividad para modo oscuro. Se emplea en llamadas a la acción primarias (CTAs), botones de inicio en cabecera, indicadores de estado de agentes IA activos y detalles de acentuación luminosa.
- **Cyber Cyan Bright** (`#22d3ee`): Tonalidad de resplandor (`text-shadow`, halos y estados hover en modo oscuro).

### Secondary
- **Deep Iris Purple** (`#7c3aed`): Utilizado como color de soporte en gradientes de fondo heroicos (`from-indigo-900 via-purple-800 to-indigo-900`), detalles de integración multicanal y badges temáticos de automatización avanzada.
- **Operational Emerald** (`#10b981`): Utilizado exclusivamente para validaciones positivas, badges de transparencia ("Activo 24/7", "Contrato Seguro") y métricas de incremento de facturación.

### Neutral
- **Obsidian Night** (`#060c18`): Lienzo base en modo oscuro, enriquecido con viñetas radiales de luz fría en el fondo del cuerpo.
- **Slate Obsidian Surface** (`#0f172a`): Superficie elevada para contenedores principales, tarjetas de panel y campos de entrada en modo oscuro.
- **Deep Navy Border** (`#334155`): Frontera sutil de 1px que otorga contorno y definición a tarjetas oscuras sin contrastes agresivos.
- **Pure Canvas White** (`#ffffff`): Fondo primordial en modo claro para máxima legibilidad documental y corporativa.
- **Cool Paper Slate** (`#f8fafc`): Superficie secundaria en modo claro para secciones alternas, fondos de tabla y tarjetas sutiles.
- **Light Border** (`#e2e8f0`): Delimitador estándar para componentes en modo claro.
- **Deep Slate Text** (`#020817`): Color de texto para títulos y contenido principal en modo claro.
- **Muted Slate Text** (`#64748b` en claro / `#94a3b8` en oscuro): Texto secundario, subtítulos, etiquetas y descripciones de apoyo.
- **Cold White Text** (`#e2e8f0`): Texto principal en modo oscuro con contraste contrastado superior a 7:1 sobre el fondo obsidiana.

### Named Rules
**The 10% Cyan Halo Rule.** El cian reactivo (`#38bdf8`) nunca debe cubrir más del 10% de la superficie visual de una pantalla. Su función es actuar como baliza de atención inmediata (CTAs de conversión, métricas destacadas y halos de hover); nunca como fondo plano masivo de sección.

**The Obsidian Depth Rule.** En modo oscuro nunca se utiliza negro puro (`#000000`) como fondo de componentes. La profundidad se construye mediante escalones tonales controlados: base obsidiana (`#060c18`), tarjeta elevada (`#0f172a`) y borde atenuado (`#334155`).

## Typography

**Display Font:** Inter (con fallback en system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)  
**Body Font:** Inter (con fallback en system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)  
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace (reservado exclusivamente para valores técnicos, códigos de API y métricas de webhook)

**Character:** Tipografía sans-serif moderna, geométrica y de alta legibilidad en pantallas retina. Se prioriza un espaciado ligeramente negativo en títulos para proyectar precisión de ingeniería, y un cuerpo abierto con altura de línea generosa (1.6) para lectura fluida de propuestas y términos legales.

### Hierarchy
- **Display** (800 / Extrabold, `clamp(2.5rem, 5vw, 4rem)`, line-height 1.1, tracking -0.03em): Encabezado principal en secciones Hero. Transmite el mensaje de impacto con presencia inquebrantable.
- **Headline** (700 / Bold, `clamp(1.875rem, 3.5vw, 2.5rem)`, line-height 1.2, tracking -0.02em): Títulos de sección principal (Planes, CRM Todo-en-Uno, Beneficios, Sobre nosotros).
- **Title** (600 / Semibold, `1.25rem` a `1.5rem`, line-height 1.35, tracking -0.01em): Títulos de tarjetas Bento, características individuales y nombres de planes.
- **Body** (400 / Regular, `1rem` [16px], line-height 1.6, tracking normal, max-width 65–75ch): Párrafos descriptivos, explicaciones operativas y cláusulas legales.
- **Label** (500 o 600 / Medium/Semibold, `0.75rem` [12px] a `0.875rem` [14px], tracking 0.01em): Insignias de categoría, textos de botones, encabezados de tabla e índices de navegación.

### Named Rules
**The Balanced Heading Rule.** Los encabezados de 2 o más líneas deben mantener un equilibrio visual sin huérfanas ni desbordamientos abruptos; se prohíbe el uso de texto degradado sobre títulos largos de más de una oración. El realce se genera por peso tipográfico y acento de una sola palabra clave.

**The Functional Monospace Rule.** Las fuentes monoespaciadas se reservan de forma estricta para datos computacionales (tokens, identificadores de Stripe, payloads de webhooks, números de versión). Nunca se usan como artificio cosmético en párrafos o etiquetas de marketing.

## Layout

El sistema espacial de Kinexting está optimizado para interfaces SaaS modernas y páginas de aterrizaje de alta conversión.

- **Contenedor Maestro:** Centrado automáticamente con un ancho máximo de `1400px` (`max-w-7xl` a `2xl`) y relleno perimetral adaptable (`1rem` en móviles, `2rem` en escritorios).
- **Ritmo Vertical:**
  - Separación entre secciones mayores: `4rem` (64px) a `6rem` (96px).
  - Separación entre bloques internos de sección: `2rem` (32px) a `3rem` (48px).
  - Separación entre elementos atómicos (título, descripción, CTA): `1rem` (16px) a `1.5rem` (24px).
- **Grillas Bento & Modulares:** Las secciones clave (CRM, Beneficios, Métricas) utilizan grillas asimétricas con proporciones calculadas (`md:grid-cols-2`, `lg:grid-cols-3`, `lg:grid-cols-4` con `gap-6` [24px]), evitando cuadrículas monótonas de tarjetas gemelas.
- **Densidad de Lectura:** El ancho de los bloques de texto continuo nunca supera los `75ch` (`max-w-3xl`) para garantizar un recorrido visual descansado y ergonómico.

## Elevation & Depth

Kinexting utiliza un modelo híbrido de **Capas Tonales con Resplandor Ambiental (Ambient Layering & Soft Glow)**. No existen sombras artificiales oscuras en ángulo duro (`4px 4px 0px`); en su lugar, la tridimensionalidad se expresa mediante desenfoques profundos, elevaciones por estado interactivo y reflejos luminosos en el espectro cian y zafiro.

### Shadow Vocabulary
- **Elev-1 (Reposo Base):** `box-shadow: 0 1px 2px rgba(15,23,42,0.06), 0 8px 22px rgba(15,23,42,0.1)`  
  *Modo oscuro:* `0 1px 2px rgba(2,6,23,0.62), 0 10px 26px rgba(2,6,23,0.5)`  
  Utilizado en tarjetas estáticas, bloques de cotización y paneles de resumen.
- **Elev-2 (Contenedor Primario / Dropdown):** `box-shadow: 0 2px 6px rgba(15,23,42,0.08), 0 14px 34px rgba(15,23,42,0.14)`  
  *Modo oscuro:* `0 2px 6px rgba(2,6,23,0.66), 0 16px 38px rgba(2,6,23,0.56)`  
  Utilizado en menús flotantes, modales y tarjetas destacadas de planes.
- **Elev-3 (Capa Superior / Modal Activo):** `box-shadow: 0 4px 12px rgba(15,23,42,0.1), 0 22px 52px rgba(15,23,42,0.2)`  
  *Modo oscuro:* `0 4px 12px rgba(2,6,23,0.72), 0 24px 56px rgba(8,47,73,0.42)`  
  Utilizado en ventanas emergentes de conversión, drawers y diálogos críticos.
- **Elev-Interactive (Hover Dinámico):** Transición fluida `transform -translate-y-0.5` con expansión de sombra a `0 6px 18px rgba(2,6,23,0.6), 0 18px 38px rgba(14,165,233,0.18)` en modo oscuro.

### Named Rules
**The Ambient Glow Rule.** Los destellos de color solo existen en respuesta a un estado (hover en tarjeta, botón activo o scrollbar). En reposo, las superficies descansan en su color base sin halos permanentes distractores.

**The Micro-Lift Rule.** Todo elemento interactivo principal (botones de acción y tarjetas clickeables) debe elevarse exactamente `2px` (`-translate-y-0.5`) al situar el cursor, con una duración de `200ms` y curva `ease-out`.

## Shapes

- **Estrategia de Radio (Radius):**
  - **Botones y Campos:** `6px` a `8px` (`rounded-md` / `rounded-lg`). Aporta modernidad sin caer en estéticas infantiles o burbujas excesivas.
  - **Tarjetas y Paneles Bento:** `12px` a `16px` (`rounded-xl` / `rounded-2xl`). Curvatura amplia que enmarca el contenido con elegancia.
  - **Insignias e Indicadores de Estado:** `9999px` (`rounded-full`). Píldoras compactas que comunican estado atómico ("24/7", "WhatsApp IA", "Plan Anual").
- **Fronteras y Delimitación:**
  - Todas las tarjetas poseen un contorno de exactamente `1px` (`border border-border/70` o `border-border/50`).
  - Se prohíben bordes laterales gruesos decorativos (`border-l-4` innecesarios) salvo en alertas contractuales estrictamente justificadas.

## Components

### Buttons
- **Shape:** `rounded-md` (radio de 6px a 8px), altura estándar `40px` (`h-10 px-4 py-2`).
- **Primary (Light Mode):** Fondo Índigo Eléctrico (`#4f46e5`), texto blanco (`#ffffff`), sombra sutil de elevación. En hover: fondo `#4338ca`, elevación `-translate-y-0.5`.
- **Primary (Dark Mode):** Fondo Cian Reactivo (`#38bdf8`), texto obsidiana oscuro (`#0f172a`), peso semibold (600). En hover: fondo `#22d3ee`, halo cian difuso.
- **Outline / Secondary:** Fondo transparente o blanco sutil, borde de 1px (`border-input` / `border-slate-600`), texto del primer plano. En hover: fondo `bg-accent` con texto acentuado.
- **Ghost:** Sin fondo ni borde en reposo; se activa con fondo sutil en hover (`bg-accent/60`) para acciones secundarias como botones de navegación y retorno.

### Chips / Badges
- **Style:** Estilo píldora (`rounded-full`), padding `px-2.5 py-0.5` o `px-3 py-1`, texto en tamaño minúsculo `text-xs font-semibold`.
- **Tratamiento Cromático:** Fondo translúcido al 10% del color temático (`bg-primary/10 text-primary` o `bg-emerald-500/10 text-emerald-500`) con borde transparente o semitransparente del mismo tono.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px) o `rounded-2xl` (16px).
- **Background:** Blanco puro (`#ffffff`) en modo claro; `#0f172a` (Slate Obsidian) o gradiente translúcido con desenfoque de fondo (`backdrop-blur-sm`) en modo oscuro.
- **Border:** `1px solid border-border/70`.
- **Internal Padding:** Escala cómoda de `p-6` (24px) a `p-8` (32px).

### Inputs / Fields
- **Style:** Altura `40px` (`h-10`), radio `rounded-md` (6px), borde sutil `border-input` (`#e2e8f0` en claro / `#334155` en oscuro).
- **Sombra Interna:** Sutil relieve táctil mediante `box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 2px rgba(15,23,42,0.06)`.
- **Focus:** Anillo exterior nítido de 2px en color primario (`ring-2 ring-ring ring-offset-2`).

### Navigation
- **Header:** Barra fija superior pegajosa (`sticky top-0 z-40`), fondo translúcido con desenfoque (`bg-background/80 backdrop-blur-md`), borde inferior de 1px.
- **Branding:** Alternancia automática entre `/logos/fullBlack.png` (modo claro) y `/logos/fullWhite.png` (modo oscuro) con altura calibrada a 28–32px.
- **Controles:** Enlaces directos a secciones clave, botón de cambio de tema (`ThemeToggle`) y CTA directo a contratación (`/checkout`).

### Signature Component: Bento Feature Grid & Cyber Scrollbar
- **Bento Grid:** Disposición inteligente con tarjetas de 1x y 2x columnas que combinan íconos enmarcados en cápsulas de color primario, títulos jerárquicos y diagramas de flujo interactivo (WhatsApp $\rightarrow$ CRM $\rightarrow$ Métricas).
- **Cyber Scrollbar:** Barra de desplazamiento con gradiente activo en modo oscuro (`linear-gradient(180deg, #22d3ee 0%, #2563eb 52%, #7c3aed 100%)`) con resplandor cyan de 12px al interactuar.

## Do's and Don'ts

### Do:
- **Do** respetar la regla del 10% de Cian: utiliza `#38bdf8` únicamente en puntos focales de interacción y conversión.
- **Do** mantener el radio de curvatura consistente: `6px–8px` para controles y `12px–16px` para tarjetas.
- **Do** incluir soporte impecable para ambos temas (claro y oscuro) en cualquier nueva vista o componente.
- **Do** utilizar elevaciones elásticas sutiles (`-translate-y-0.5` con `200ms ease-out`) en elementos interactivos principales.
- **Do** limitar el ancho de párrafos a un máximo de 75 caracteres para optimizar la ergonomía de lectura.
- **Do** formular precios y periodos contractuales estrictamente en MXN y plazos de 3 meses (trimestral) o 12 meses (anual).

### Don't:
- **Don't** utilizar negro puro `#000000` como fondo de tarjetas o componentes; utiliza la escala de obsidiana (`#060c18` y `#0f172a`).
- **Don't** aplicar gradientes de color multicolores sobre cuerpos extensos de texto.
- **Don't** emplear sombras duras sin desenfoque (`box-shadow: 4px 4px 0px`); rompen la estética fluida y tecnológica del sistema.
- **Don't** crear tarjetas repetitivas de igual tamaño con sólo un ícono y una frase; diseña composiciones modulares con peso visual variado.
- **Don't** sobrecargar las pantallas con bordes coloreados gruesos (`border-l-4` o superiores) como sustituto de una buena jerarquía tipográfica.
- **Don't** usar fuentes monoespaciadas para textos publicitarios o párrafos de venta; resérvalas únicamente para datos de código o parámetros técnicos.
