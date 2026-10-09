# Banners de la radio

Guardar todas las imágenes de banners en esta carpeta, con nombres descriptivos en minúsculas y separados por guiones.

## Medidas para solicitar nuevos diseños

- Formato vertical: **300 × 600 px**, proporción **1:2**.
- Para pantallas de alta densidad, preferir **600 × 1200 px** con la misma proporción.
- Entregar en WebP, PNG o JPG, optimizado para web y sin márgenes añadidos al diseño.
- Mantener textos y logotipos dentro del área segura del afiche.

Estas medidas son la referencia del archivo de diseño, no un límite fijo de tamaño en pantalla. El banner inferior usa el 90% del ancho disponible para mejorar la lectura; los laterales usan el espacio libre. En celular/tablet conserva el marco y la sombra. Las imágenes se muestran completas, sin estirar ni recortar. El afiche inicial de Expo Anime conserva sus dimensiones originales 1080 × 1350 px.

Para que un banner 300 × 600 sea legible, preparar una versión específica con título grande, mensaje breve y datos esenciales. Evitar reducir un afiche con mucho texto al formato de banner. Al pulsar el banner se abre la imagen completa.

El catálogo único está en `src/constants/banners.ts`. Para añadir un banner, copiar aquí su imagen y añadir al catálogo su ID, título, ruta pública, texto alternativo y dimensiones originales.

Actualmente ambos laterales muestran el primer banner del catálogo. Añadir imágenes no activa una rotación: el carrusel se implementará más adelante. En móvil se mantiene una sola copia.
