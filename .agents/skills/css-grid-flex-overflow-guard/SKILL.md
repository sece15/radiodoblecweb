---
name: css-grid-flex-overflow-guard
description: Regla obligatoria para prevenir desbordamientos horizontales y recortes de interfaz en CSS Grid y Flexbox (tarjetas, grillas de pads, modales, columnas y filas con texto truncado). Úsala siempre que crees o modifiques cualquier layout con `display: grid`, `display: flex`, `whiteSpace: "nowrap"` o `textOverflow: "ellipsis"`.
---

# Guardián de Overflow en CSS Grid y Flexbox (`minmax(0, 1fr)` + `minWidth: 0`)

En CSS Grid y Flexbox, el tamaño mínimo intrínseco de los hijos es `auto` (`min-width: auto`). Cuando un hijo contiene texto largo con `white-space: nowrap` o `text-overflow: ellipsis`, un track definido como `1fr` (que equivale a `minmax(auto, 1fr)`) se expande al ancho del contenido en lugar de truncarlo, rompiendo la tarjeta y desbordando columnas hacia afuera del contenedor.

## Reglas Obligatorias de Validación

Antes de dar por terminado cualquier componente UI en `src/components/**` o `src/app/**`, **SIEMPRE** valida estos 5 puntos:

1. **Nunca uses `1fr` desnudo en `gridTemplateColumns` cuando haya texto variable o truncado**:
   - Incorrecto: `gridTemplateColumns: "1fr 1fr"` o `repeat(2, 1fr)`
   - Correcto: `gridTemplateColumns: "repeat(2, minmax(0, 1fr))"` o `minmax(0, 1fr) minmax(0, 1fr)`
   - (En Tailwind: `grid-cols-2` ya usa `minmax(0, 1fr)`, pero en `style={{ ... }}` inline NO se aplica automáticamente).

2. **Aplica `minWidth: 0` en toda la cadena de contenedores Grid/Flex**:
   - El contenedor de la tarjeta o columna (`display: flex` o hijo de un grid).
   - El contenedor de la sub-grilla (`width: "100%", minWidth: 0`).
   - Cada ítem/botón dentro del grid (`minWidth: 0, width: "100%", overflow: "hidden", boxSizing: "border-box"`).

3. **Truncado seguro (`ellipsis`) dentro de botones o filas Flex**:
   - El texto truncable debe llevar `display: "block"`, `width: "100%"`, `maxWidth: "100%"`, `minWidth: 0`, `whiteSpace: "nowrap"`, `overflow: "hidden"`, `textOverflow: "ellipsis"`.
   - Agregar `title={textoCompleto}` al elemento para mantener accesibilidad al pasar el cursor.

4. **Protege etiquetas fijas junto a texto variable**:
   - En filas `display: flex; justifyContent: "space-between"` (por ejemplo, título + duración `1:27` o badge), agregar `gap` y `flexShrink: 0` al elemento de ancho fijo (timestamp, icono, botón) y `minWidth: 0` al elemento de texto variable.

5. **Contención de la tarjeta padre**:
   - Toda tarjeta o panel de columna debe declarar `minWidth: 0`, `overflow: "hidden"` (o `overflowX: "hidden"`) y `boxSizing: "border-box"` para que ningún hijo pueda salirse del borde visual.

## Plantilla de Referencia

```tsx
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "6px",
    width: "100%",
    minWidth: 0,
  }}
>
  <button
    type="button"
    title={item.label}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      minWidth: 0,
      width: "100%",
      overflow: "hidden",
      boxSizing: "border-box",
    }}
  >
    <span
      style={{
        display: "block",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {item.label}
    </span>
  </button>
</div>
```

## Caso Real que Originó Esta Regla

- `src/components/studio/plugins/CDiggerModal.tsx` (grilla `8 PADS DE CORTE`): `gridTemplateColumns: "1fr 1fr"` sin `minmax(0, 1fr)` ni `minWidth: 0` en los botones hacía que la columna derecha (`PAD 2, 4, 6, 8`) se saliera del borde de la tarjeta y quedara cortada.
