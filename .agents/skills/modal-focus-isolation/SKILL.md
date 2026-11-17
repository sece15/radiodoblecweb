---
name: modal-focus-isolation
description: Regla obligatoria para aislar cualquier modal de la página principal y de modales inferiores usando `useModalIsolation` (foco dentro del modal, bloqueo de scroll, captura de teclado Space/Escape/Tab y pila de modales anidados). Úsala siempre que crees o modifiques un modal en el proyecto.
---

# Modal Focus & Keyboard Isolation (`useModalIsolation`)

En aplicaciones de audio/radio con reproductores globales y modales anidados (por ejemplo `C-Sampler` → `Cortar Pad` → `C-Master`), abrir un modal sin aislar el foco y el teclado provoca que presionar `Space`, `Tab` o `Escape` dispare el Play/Pause de la página principal o los atajos de un modal inferior.

## Regla Obligatoria para Todos los Modales

Todo modal nuevo o existente en `src/components/**` **DEBE**:

1. Importar y usar `useModalIsolation` desde `@/hooks/useModalIsolation`.
2. Asignar `ref={modalContainerRef}`, `tabIndex={-1}`, `role="dialog"` y `aria-modal="true"` al contenedor raíz del modal (cuando no esté en modo `isStandalone`).
3. Si el modal registra su propio `window.addEventListener("keydown", ...)` para atajos adicionales (como pads o flechas):
   - Registrarlo en **fase de captura** (`true`).
   - Verificar `if (!isTopModal()) return;` al inicio del handler para no interferir con modales hijos abiertos encima.
   - Llamar `e.preventDefault()` y `e.stopPropagation()` en cada atajo manejado (especialmente `Space`) para que no se propague ni dispare botones del fondo.
   - Ignorar eventos cuando `target` sea `INPUT`, `TEXTAREA`, `SELECT` o `isContentEditable`.

## Ejemplo Estándar

```tsx
import { useRef } from "react";
import { useModalIsolation } from "@/hooks/useModalIsolation";

const modalContainerRef = useRef<HTMLDivElement | null>(null);

const { isTopModal } = useModalIsolation(isOpen, modalContainerRef, {
  onEscape: onClose,
  onSpace: handleTogglePlayPause, // Opcional si el modal tiene Play/Pause propio
});

return (
  <div
    ref={modalContainerRef}
    tabIndex={-1}
    role="dialog"
    aria-modal="true"
  >
    ...
  </div>
);
```

## Modales Ya Cubiertos en el Proyecto

- `src/hooks/useModalIsolation.ts` (pila global `openModalStack`, bloqueo de `body.style.overflow`, trampa de `Tab` y captura de `Space`/`Escape`)
- `src/components/studio/plugins/CSamplerPluginModal.tsx`
- `src/components/studio/plugins/CSamplerCutPadModal.tsx`
- `src/components/studio/plugins/CSamplerMasterModal.tsx`
- `src/components/studio/plugins/CDiggerModal.tsx`
- `src/components/common/NeoModal.tsx`
