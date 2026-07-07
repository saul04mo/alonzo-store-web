# Meta Pixel — Integración y paso a producción

Guía de la integración del Meta Pixel (Facebook/Instagram Ads) en ALONZO Store:
qué está instalado, qué se necesita de la cuenta de Meta real y cómo pasar a
producción paso a paso.

---

## 1. Estado actual

La integración del Pixel ya está **lista y funcionando en el código**. Solo
depende de **una variable de entorno** con el ID del Pixel; sin ID, no carga
nada (no rompe la app).

**Probado y verificado** con un Pixel de prueba: los eventos llegan al
Administrador de Eventos de Meta (`PageView`, `ViewContent`, `AddToCart`, etc.).

### Archivos de la integración

| Archivo | Función |
|---|---|
| `components/MetaPixel.tsx` | Carga el Pixel y dispara `PageView` en cada navegación (incluye SPA y `<noscript>`) |
| `lib/meta-pixel.ts` | Helper `trackPixel()` para eventos de conversión |
| `types/meta-pixel.d.ts` | Tipo global de `window.fbq` (TypeScript) |
| `app/layout.tsx` | Monta `<MetaPixel />` junto a Analytics/Clarity |
| `next.config.js` | CSP con los dominios de Meta permitidos |
| `.env.example` | Documenta la variable `NEXT_PUBLIC_META_PIXEL_ID` |
| `app/api/meta-catalog/route.ts` | Feed de productos para el Catálogo de Meta (métricas por producto) |

### Eventos cableados

| Evento | Dónde se dispara | Archivo |
|---|---|---|
| `PageView` | En cada cambio de ruta | `components/MetaPixel.tsx` |
| `ViewContent` | Al abrir una ficha de producto | `components/products/ProductDetail.tsx` |
| `AddToCart` | Click en "Añadir al carrito" o "Comprar ahora" | `components/products/ProductDetail.tsx` |
| `InitiateCheckout` | Al entrar al checkout con ítems | `components/checkout/CheckoutPage.tsx` |
| `Purchase` | Al confirmar un pedido (tras `createOrder`) | `components/checkout/CheckoutPage.tsx` |

Cada evento envía `content_ids`, `value` y `currency: 'USD'`.

### Variable de entorno

```
NEXT_PUBLIC_META_PIXEL_ID=<id_del_pixel>
```

- **Local:** se pone en `.env.local` (NO se sube al repo, está en `.gitignore`).
- **Producción:** se pone en las variables de entorno de **Netlify**.

> Importante: las variables `NEXT_PUBLIC_*` se leen al **arrancar** el server.
> Si cambias el ID, hay que **reiniciar** el dev server (local) o **redeploy**
> (Netlify).

---

## 2. Qué se necesita de la cuenta de Meta de producción

La cuenta usada hasta ahora es de **prueba**. Para producción se necesita, de la
**cuenta real del negocio**:

1. **Acceso de administrador** al Business Manager (Meta Business Suite) del
   negocio: <https://business.facebook.com>.
2. **El Pixel de producción** (su ID — un número largo). Puede ser uno que ya
   exista o uno nuevo creado en esa cuenta (ver paso a paso abajo).
3. **(Recomendado) La cuenta publicitaria** del negocio, para vincular el Pixel
   y poder usarlo en campañas.
4. **(Recomendado) Acceso para verificar el dominio** `alonzocollection.com` en
   esa cuenta de negocio (necesario para medición precisa en iOS — ver sección 5).

> Lo único que el **código** necesita es **el ID del Pixel de producción**.
> Todo lo demás (vincular cuenta publicitaria, verificar dominio) es
> configuración dentro de Meta que mejora el rendimiento, pero no toca el código.

---

## 3. Paso a paso para subir a producción

### Paso 1 — Crear/obtener el Pixel de producción

1. Entra a <https://business.facebook.com/events_manager> con la **cuenta real**.
2. Si **no** tienes Pixel: click en **"Conectar datos"** → **"Web"** → ponle
   nombre (ej. "ALONZO Store") → al terminar te da el **ID del Pixel**.
3. Si **ya** tienes Pixel: selecciónalo y copia su **Identificador** (arriba,
   junto al nombre).
4. Copia ese número. Ejemplo de formato: `2830350407328729`.

### Paso 2 — Configurar la variable en Netlify

1. Entra al sitio en Netlify → **Site settings** → **Environment variables**.
2. **Add a variable** → key/value:
   - Key: `NEXT_PUBLIC_META_PIXEL_ID`
   - Value: el ID del Pixel de producción (solo números).
3. Guardar.

### Paso 3 — Desplegar el código

1. Asegúrate de que los cambios de la integración estén en `main` (commit +
   push).
2. En Netlify: **Deploys** → **Trigger deploy** → **Deploy site**.
   (Si hiciste push, Netlify suele desplegar solo.)

> El redeploy es **obligatorio** después de agregar la variable: Netlify la
> "hornea" en el build, no la lee en caliente.

### Paso 4 — Verificar en producción

1. Abre tu web real <https://alonzocollection.com>.
2. Con la extensión **Meta Pixel Helper** (Chrome) confirma que dispara el Pixel
   correcto y muestra `PageView`.
3. En el Administrador de Eventos → tu Pixel → pestaña **"Probar eventos"**:
   - Pega `https://alonzocollection.com` y/o navega tu web.
   - Verifica que aparecen en vivo: `PageView`, `ViewContent`, `AddToCart`,
     `InitiateCheckout` y `Purchase` (este último con una compra real/de prueba).
4. Comprobación técnica alternativa (DevTools → Network, filtro `tr?`): debes ver
   peticiones a `facebook.com/tr?id=<TU_ID>&ev=...`.

---

## 4. Checklist rápido

- [ ] Acceso admin al Business Manager de producción.
- [ ] Pixel de producción creado / localizado → ID copiado.
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` agregada en Netlify con el ID real.
- [ ] Código en `main` (commit + push).
- [ ] Redeploy en Netlify.
- [ ] Verificado con Pixel Helper + "Probar eventos" en el dominio real.
- [ ] (Recomendado) Dominio `alonzocollection.com` verificado en Meta.
- [ ] (Recomendado) Pixel vinculado a la cuenta publicitaria.
- [ ] (Recomendado) Catálogo conectado al feed `/api/meta-catalog` y vinculado al Pixel — ver sección 5.
- [ ] (Recomendado) Eventos prioritarios configurados (AEM) — ver sección 6.

---

## 5. Catálogo de Meta — métricas por producto

Para tener métricas por producto (**más vistos / más comprados**) con nombres,
fotos y precios —y habilitar anuncios dinámicos de retargeting— se usa un
**Catálogo de Meta** alimentado por un **feed automático**.

### El feed ya está construido

Endpoint: **`/api/meta-catalog`** → en producción:
`https://alonzocollection.com/api/meta-catalog`

- Genera un feed XML (formato Google/Meta) con **todos los productos activos**.
- Respeta las categorías ocultas del POS (no anuncia lo oculto).
- **Clave:** el `<g:id>` de cada item es el **mismo `product.id`** que el Pixel
  envía en `content_ids`. Por eso Meta enlaza vista → carrito → compra por
  producto, y las métricas salen completas y correctas.
- Incluye: id, título, descripción, link, imagen(es), disponibilidad (según
  stock de variantes), precio, `sale_price` si hay oferta, marca y categoría.
- Moneda: **USD**.

### Cómo conectarlo en Meta (una sola vez)

1. Entra a **Administrador de Comercio** (Commerce Manager):
   <https://business.facebook.com/commerce>.
2. **Catálogo → Orígenes de datos → Agregar artículos → Feed de datos / Usar URL
   programada**.
3. Pega la URL del feed: `https://alonzocollection.com/api/meta-catalog`.
4. Programa la actualización (p. ej. **diaria**). Moneda: **USD**.
5. **Vincula el catálogo con el Pixel** `NEXT_PUBLIC_META_PIXEL_ID`:
   en el catálogo → **Configuración / Orígenes de eventos** → conecta el Pixel.
   Esto es lo que cruza los eventos del Pixel con los productos del catálogo.

> El feed es público (Meta lo descarga sin login). Solo expone datos que ya son
> públicos en la tienda.

### Dónde ver las métricas por producto

- **Más vistos / más añadidos:** Administrador de Eventos → tu Pixel → evento
  `ViewContent` / `AddToCart` → **desglosar por** `content_name` o `content_id`.
- **Más comprados:** evento `Purchase` → desglosar por `content_id` (con el
  catálogo vinculado, Meta muestra el nombre del producto en vez del ID).
- **Vista de catálogo:** Commerce Manager → tu catálogo → pestaña de
  rendimiento/insights de artículos.

### Verificar el feed

```
curl https://alonzocollection.com/api/meta-catalog | head -40
```
Debe devolver XML con `<item>` por cada producto. En Commerce Manager, tras
cargar el feed, revisa que no haya errores (precio, imagen y descripción son
obligatorios — el feed ya los garantiza y salta productos sin precio/imagen).

---

## 6. Recomendaciones para máximo rendimiento (opcional)

Estas no son obligatorias para que el Pixel "funcione", pero mejoran mucho la
medición real de campañas:

### Verificación del dominio
En **Configuración del negocio → Seguridad de la marca → Dominios**, agrega y
verifica `alonzocollection.com`. Mejora la atribución y es requisito para la
medición de eventos agregados (iOS 14.5+).

### Medición de eventos agregados (AEM)
En el Administrador de Eventos → **Configuración de eventos agregados**,
configura hasta **8 eventos prioritarios** por dominio. Sugerido para una tienda:
1. Purchase
2. InitiateCheckout
3. AddToCart
4. ViewContent
5. (los demás según tus objetivos)

Esto permite optimizar campañas hacia usuarios de iPhone que rechazan el
rastreo.

### Conversions API (CAPI) — siguiente nivel
La integración actual es **del lado del navegador**. Para máxima precisión
(eludir bloqueadores de anuncios y limitaciones de iOS), el siguiente paso sería
enviar los eventos también **desde el servidor** con la Conversions API. No es
necesario para empezar, pero es la evolución natural cuando inviertas más en
anuncios.

---

## 7. Notas y problemas comunes

- **Content Security Policy (CSP):** el sitio tiene una lista blanca de dominios
  en `next.config.js`. Los dominios de Meta ya están incluidos
  (`connect.facebook.net` y `www.facebook.com`). Si en consola ves un error de
  "violates Content Security Policy" relacionado con facebook, revisa que esos
  dominios sigan en `script-src`, `img-src` y `connect-src`.
- **El ID no cambia en local:** reinicia el dev server (`npm run dev`). Las
  variables `NEXT_PUBLIC_*` solo se leen al arrancar.
- **No veo eventos en "Resumen":** esa pestaña tiene retraso de hasta ~30 min.
  Para ver en vivo usa **"Probar eventos"**.
- **Pixel Helper no muestra nada:** suele ser un bloqueador de anuncios / Brave
  bloqueando `connect.facebook.net`, o que la pestaña no se recargó tras cambiar
  el ID (usa `Ctrl + Shift + R`).
- **El `.env.local` no se sube al repo** (está en `.gitignore`). El ID de
  producción vive en Netlify, no en el código.
