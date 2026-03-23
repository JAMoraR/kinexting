# kinexting

## Stripe setup (fase inicial)

1. Copia las variables de `.env.example` a tu `.env.local`.
2. Configura `STRIPE_SECRET_KEY` con tu clave de Stripe.
3. Configura `NEXT_PUBLIC_APP_URL` con la URL pública de la app.

### Convenciones usadas en esta implementación

- Lookup keys de planes: `plan.{planId}.{monthly|annual}`
- Lookup keys de extras: `extra.{extraId}.{monthly|annual}`

Ejemplos:

- `plan.landing.monthly`
- `plan.chatbot-webapp.annual`
- `extra.web-cdn.monthly`
- `extra.chatbot-ia-credits.annual`

### Metadata esperada en Stripe Prices

Para planes:

- `plan_id`: `landing | chatbot | webapp | chatbot-webapp`
- `title`, `description`
- `features` (separadas por `|`)
- `differences` (separadas por `|`)
- `button_text`
- `cheap`, `popular`, `recommended`, `high_quality` (`true/false`)

Para extras:

- `extra_id` (ej. `web-cdn`, `chatbot-messages`)
- `category` (`web | chatbot | combo`)
- `name`, `description`
