# Lista de espera del Plan gestor

1. Ejecuta `migrations/202611110001_plan_gestor_waitlist.sql` en el SQL Editor del proyecto Supabase. Crea una tabla nueva; no cambia las tablas existentes.
2. Configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor (variables ya documentadas en `.env.example`). La clave service role nunca debe llevar el prefijo NEXT_PUBLIC.
3. Publica la rama `waitlist` y abre `/waitlist`. No hay enlaces desde la landing principal, ni entrada en el sitemap. La página tiene `noindex`.
4. Los registros están en `public.plan_gestor_waitlist`, visibles desde Table Editor de Supabase. Se conserva fecha y versión del consentimiento y el beneficio de 1 mes trimestral / 3 meses anual.

Se admite correo, WhatsApp internacional válido o ambos. Los duplicados por cualquiera de los contactos reciben una respuesta genérica exitosa sin modificar ni revelar datos anteriores. Si alguien ya registrado quiere agregar otro contacto, se requiere un flujo de verificación futuro; este formulario no modifica registros existentes.

RLS está activo y anon/authenticated no tienen permisos sobre la tabla. Solo la API del servidor inserta con service role. Incluye un campo trampa para bots y validación de origen/tamaño; para campañas de alto tráfico conviene añadir protección contra abuso en el proveedor de despliegue.

El registro no envía correos ni mensajes, no crea suscripciones y no activa descuentos automáticamente. Guarda el beneficio para aplicarlo al lanzamiento.
