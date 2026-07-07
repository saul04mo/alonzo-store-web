---
name: ALONZO Store
description: Tienda de moda streetwear mobile-first — lujo silencioso, paleta monocroma blanco / gris / negro.
colors:
  ink: "#0a0a0a"
  dark: "#1a1a1a"
  charcoal: "#333333"
  gray-100: "#fafafa"
  gray-200: "#f5f5f5"
  gray-300: "#eeeeee"
  gray-400: "#cccccc"
  gray-500: "#999999"
  gray-600: "#666666"
  gray-700: "#444444"
  surface: "#ffffff"
  success: "#2ecc71"
  danger: "#d9665a"
  warning: "#f39c12"
typography:
  display:
    fontFamily: "var(--font-bebas), Impact, 'Helvetica Neue Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.5rem, 9vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "0.05em"
  body:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.15em"
rounded:
  none: "0px"
  sm: "2px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    typography: "{typography.label}"
  button-primary-disabled:
    backgroundColor: "{colors.gray-400}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.none}"
    padding: "14px 24px"
    typography: "{typography.label}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.gray-600}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  input-line:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.none}"
    padding: "6px 0"
    typography: "{typography.body}"
---

# Design System: ALONZO Store

## 1. Overview

**Creative North Star: "El Esencial Silencioso"**

ALONZO es lujo que no levanta la voz. La interfaz es un espacio en blanco y negro
donde la única protagonista es la ropa: fotografía a sangre, mucho aire, y un
sistema tipográfico que comunica con jerarquía y mayúsculas en vez de color. El
referente declarado es el look "Everyday Essentials" de Fear of God — esencial,
costoso por restraint, nunca por ornamento. Cada decisión visual pasa por un
filtro: ¿esto ayuda a comprar más rápido y comunica calidad sin gritar? Si no,
se quita.

El sistema es **monocromático por doctrina**: la marca es blanco, gris y negro, y
nada más. Una rampa de negros y grises sobre blanco puro, sin color de acento. El
único color saturado en pantalla lo aporta la fotografía de producto. La
densidad es baja y deliberada; el espacio es un material, no un sobrante. Es una
experiencia **mobile-first real**: diseñada para el pulgar dentro de un lienzo
angosto (450px en móvil, 1200px en desktop), no un escritorio encogido.

Lo que este sistema **rechaza explícitamente**: el marketplace recargado tipo
Shein/AliExpress (banners apilados, descuentos gritando); la plantilla genérica
de Shopify; la estética DTC juguetona (colorida, redondeada, con mascotas); y el
lujo "ruidoso" maximalista (todo dorado, ornamentado). El lujo aquí es ausencia,
no exceso.

**Key Characteristics:**
- Paleta monocroma pura: negro / carbón / grises sobre blanco. Sin color de acento.
- Tipografía: Bebas Neue condensada para display, Inter para todo lo demás.
- MAYÚSCULAS globales, con excepciones para inputs, placeholders y datos del usuario.
- Esquinas afiladas (radio 0) en botones; pill (9999px) solo en chips y badges.
- Casi sin sombras: profundidad por bordes finos y capas tonales.
- Movimiento sobrio: fades y slides cortos con ease-out, nunca rebote.

## 2. Colors

Una rampa monocroma disciplinada sobre blanco puro. La marca es blanco, gris y
negro — sin color de acento. Está calibrada para que la fotografía de producto
sea lo único con color en pantalla.

### Primary
- **Tinta Negra** (#0a0a0a): el color de acción y de marca. Fondo de botones
  primarios, badge del carrito, estado activo de chips, y texto de máxima
  jerarquía. Es el "negro ALONZO".
- **Carbón** (#333333): color de texto por defecto del cuerpo. Más suave que la
  tinta pura para lectura prolongada sin perder contraste fuerte sobre blanco.

### Neutral
- **Blanco Superficie** (#ffffff): fondo dominante de toda la app y de las cards.
- **Grises 100–300** (#fafafa / #f5f5f5 / #eeeeee): fondos sutiles, placeholders
  de imagen, divisores y bordes finos.
- **Grises 400–500** (#cccccc / #999999): estados deshabilitados, texto terciario,
  tachado de talla agotada. **No usar para texto de cuerpo sobre blanco.**
- **Grises 600–700** (#666666 / #444444): texto secundario (nombre de producto,
  precio). El gris 600 sobre blanco es el piso de contraste aceptable.

### Estado (semántico, uso mínimo)
- **Verde Éxito** (#2ecc71), **Rojo Peligro** (#d9665a), **Ámbar Aviso** (#f39c12):
  feedback funcional (toasts, validación, ofertas). El rojo de ofertas vive aparte
  como `#dc2626` (red-600) en badges de descuento.

### Named Rules
**La Regla Monocroma.** La marca es blanco, gris y negro. Prohibido introducir
un color de acento "de marca". El protagonismo visual se gana con jerarquía,
escala y espacio, nunca con color.

**La Regla del Color Solo en la Ropa.** El único color saturado en pantalla viene
de la fotografía de producto, no de la UI. Si un elemento de interfaz necesita
color para destacar, la respuesta correcta es negro, no color.

**Nota sobre colores semánticos.** Verde/rojo/ámbar existen solo como feedback
funcional puntual (toasts, validación, badges de oferta). No son colores de marca
y no deben usarse como decoración ni para jerarquía visual.

## 3. Typography

**Display Font:** Bebas Neue (con fallback Impact, Helvetica Neue Condensed, Arial Narrow)
**Body Font:** Inter (con fallback system-ui, -apple-system, Segoe UI)

**Character:** Una condensada angosta y alta (Bebas) contra una grotesca neutral
y legible (Inter). Contraste por proporción y anchura, no por dos sans parecidas.
Bebas aporta la voz editorial streetwear; Inter desaparece para dejar leer.

### Hierarchy
- **Display** (Bebas 400, clamp(2.5rem, 9vw, 4.5rem), line-height 1, tracking 0.02em):
  solo titulares del hero y secciones de marca. Su sitio es grande y escaso.
- **Title** (Inter 500, 14px, line-height 1.375, tracking 0.05em, UPPERCASE):
  encabezados de sección, nombres en listados, títulos de modal.
- **Body** (Inter 400, 13px, line-height 1.25): texto general de la interfaz.
  El sistema es de escala pequeña y compacta, propio de móvil.
- **Label** (Inter 600, 10–11px, tracking 0.15em, UPPERCASE): etiquetas de campo,
  microcopy, metadatos. El tracking ancho es la firma del label.

### Named Rules
**La Regla de las Mayúsculas.** Todo el sitio es UPPERCASE por defecto. Las únicas
excepciones son donde el case importa funcionalmente: inputs, textareas, selects,
placeholders (que van en minúscula e itálica como pista), y datos del usuario
(email, contraseña, URL). Nunca mayuscular esos elementos.

**La Regla del Display Escaso.** Bebas Neue se reserva para titulares grandes del
hero. Usarla en texto pequeño o en cuerpo destruye su impacto y daña la
legibilidad; ahí manda Inter.

## 4. Elevation

Sistema **plano por defecto**. La profundidad se construye con bordes finos de 1px
(grises 200–300) y capas tonales (blanco sobre gris 100), no con sombras. La sombra
es la excepción, no la regla: aparece solo en elementos flotantes que deben
despegarse del lienzo (drawers, bottom-nav en desktop, modales).

### Shadow Vocabulary (uso mínimo)
- **Flotante suave** (`box-shadow: 0 -4px 24px rgba(0,0,0,0.08)`): borde superior
  de drawers (carrito, filtros) y bottom-sheets que suben desde abajo.
- **Pastilla nav desktop** (`box-shadow: 0 8px 24px rgba(0,0,0,0.10)`): la
  bottom-nav flotante en formato pill en desktop.

### Named Rules
**La Regla Plana.** Las superficies son planas en reposo. Si un elemento necesita
sombra para verse, primero preguntar si un borde de 1px o un cambio de fondo
tonal resuelve igual. La sombra solo se gana por estar flotando de verdad.

**El Test del Borde Fantasma.** Prohibido combinar `border: 1px solid` con
`box-shadow` de blur ≥16px en el mismo elemento. Una cosa o la otra, nunca ambas
como decoración.

## 5. Components

### Buttons
- **Shape:** esquinas afiladas, radio 0 (`rounded-none`). El botón es un
  rectángulo limpio; el redondeo se reserva para chips.
- **Primary:** fondo Tinta Negra (#0a0a0a), texto blanco, ancho completo,
  padding vertical generoso (~16px), uppercase, tracking ancho (`.btn-primary`).
- **Disabled:** fondo Gris 400 (#cccccc), opacidad 0.5, cursor not-allowed.
- **Hover / Active:** transición suave de 200ms; el outline invierte a fondo negro
  / texto blanco en `:active` (feedback táctil en móvil).
- **Outline / Secondary:** fondo blanco, borde 1px Tinta Negra, texto carbón
  (`.btn-outline`); se rellena de negro al presionar.

### Chips
- **Style:** pill completa (`rounded-full`), borde 1px, padding 8px/20px, texto
  pequeño con tracking medio. Usados para filtros de categoría con scroll horizontal.
- **State:** activo = fondo Tinta Negra + texto blanco + borde negro; inactivo =
  fondo blanco + texto Gris 600 + borde Gris 300, con hover a borde carbón.

### Cards / Containers
- **Corner Style:** las imágenes de producto usan radio 2px (`rounded-sm`); apenas
  perceptible, suaviza sin "redondear".
- **Background:** blanco superficie; placeholder de imagen en Gris 100 con el
  logo al 6% de opacidad mientras carga.
- **Shadow Strategy:** ninguna. La tarjeta de producto **no tiene chrome**: es una
  columna flex (imagen 4:5 + info debajo), sin borde ni sombra ni fondo de caja.
- **Internal Padding:** mínimo; el aire viene del gap de la grilla, no de relleno
  interno de caja.

### Inputs / Fields
- **Style:** input de **línea inferior** (`.input-luxury`): sin bordes laterales,
  solo `border-bottom` 1px Gris 300, fondo transparente, uppercase.
- **Focus:** el borde inferior pasa a Tinta Negra (transición 300ms). Sin glow,
  sin caja, sin anillo de color.
- **Placeholder:** minúscula e itálica, Gris 400, como pista visual diferenciada
  del valor que teclea el usuario.

### Navigation
- **Bottom-nav** (firma del sistema): fija al fondo en móvil, ancho completo hasta
  450px, blanco con borde superior 1px. En desktop se transforma en **pastilla
  flotante** (`rounded-full`, sombra, separada del borde inferior). Cuatro iconos
  Lucide stroke 1.5 (Home, Search, Bag, User); el carrito lleva badge circular
  negro con el contador. Solo iconos, sin texto.
- **AnnouncementBar:** marquee de loop infinito sin gaps para anuncios.

### Signature: Card de producto con tallas in-situ
La tarjeta de producto integra la selección de talla sin salir de la grilla: un
botón `+` (esquina inferior derecha, siempre visible en móvil, hover en desktop)
despliega una barra horizontal de tallas sobre la imagen. Tocar una talla
disponible agrega al carrito y abre el drawer. Cross-fade a segunda imagen en
hover (solo en dispositivos con puntero fino). Es la materialización del principio
"comprar en el menor número de pasos".

## 6. Do's and Don'ts

### Do:
- **Do** mantener UPPERCASE global y respetar las excepciones (inputs, placeholders,
  email/password/url, `.no-uppercase`).
- **Do** usar Tinta Negra (#0a0a0a) como color de acción; el negro es el "color"
  de la marca. La paleta de marca es blanco, gris y negro — y nada más.
- **Do** dejar que la fotografía de producto sea la única fuente de color saturado.
- **Do** construir profundidad con bordes 1px (Gris 200–300) y capas tonales antes
  que con sombras.
- **Do** usar Gris 600 (#666666) como piso de contraste para texto secundario sobre
  blanco; subir hacia Carbón/Tinta para texto de cuerpo importante (objetivo AA 4.5:1).
- **Do** botones de esquina afilada (radio 0); pill solo en chips y badges.
- **Do** animaciones sobrias con ease-out y su alternativa en `prefers-reduced-motion`.

### Don't:
- **Don't** parecer un marketplace recargado tipo Shein/AliExpress: banners
  apilados ni descuentos gritando por toda la pantalla.
- **Don't** caer en la plantilla genérica de Shopify (tema Dawn) ni en estética DTC
  juguetona (colorida, redondeada, ilustraciones, mascotas).
- **Don't** introducir un color de acento de marca (dorado u otro). La marca es
  monocroma: blanco, gris y negro. El color solo viene de la fotografía de producto.
- **Don't** lujo "ruidoso": nada ornamentado ni maximalista.
- **Don't** usar grises claros (400–500) para texto de cuerpo sobre blanco — falla
  contraste; es el riesgo de legibilidad #1 del proyecto.
- **Don't** redondear cards/botones a 12px+ "para que se vean modernos"; rompe la
  estética editorial afilada.
- **Don't** combinar `border: 1px solid` con `box-shadow` blur ≥16px en el mismo
  elemento (borde fantasma).
- **Don't** usar Bebas Neue en texto pequeño o de cuerpo; ahí manda Inter.
- **Don't** poner el sitio en mayúsculas donde el case importa (datos de usuario,
  campos editables).
