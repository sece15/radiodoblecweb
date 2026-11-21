---
name: modular-component-architecture
description: Regla obligatoria de arquitectura modular para componentes React y pantallas del proyecto. Separa siempre cada modal, vista o feature compleja en subcomponentes por sección visual (header, filtros/controles, reproductor/centro, pads/listas, drawer, footer), hooks de lógica y utilidades puras ensamblados desde un componente padre ligero. Úsala siempre que crees o refactorices cualquier componente o modal en el proyecto.
---

# Arquitectura Modular de Componentes (Separación por Secciones + Padre Orquestador)

Evita archivos monolíticos de más de 500–800 líneas donde coexisten constantes, persistencia, lógica compleja y cientos de líneas de JSX inline. Todo componente complejo o modal en `src/components/**` **DEBE** diseñarse con arquitectura modular desde el inicio.

## Estructura Estándar por Feature / Modal

Cuando crees o refactorices un modal o vista (por ejemplo `FeatureModal.tsx`), crea una subcarpeta dedicada junto al padre (por ejemplo `src/components/<dominio>/<feature>/`) y separa por responsabilidad:

1. **Subcomponentes visuales por sección (presentacionales y reutilizables)**:
   - `<Feature>HeaderBar.tsx` — barra superior, título, navegación y botón cerrar.
   - `<Feature>FiltersBar.tsx` / `<Feature>TopBar.tsx` — filtros, acciones rápidas y herramientas.
   - `<Feature>PlayerStage.tsx` / `<Feature>CenterView.tsx` — área central, reproductor, onda o canvas.
   - `<Feature>ControlsStrip.tsx` — perillas, sliders y selectores de modo.
   - `<Feature>PadsGrid.tsx` / `<Feature>List.tsx` — grillas de pads, listas o tablas.
   - `<Feature>Drawer.tsx` — paneles laterales (historial, favoritos, configuración).
   - `<Feature>FooterBar.tsx` — resumen inferior y CTA principal (`SIGUIENTE`, `GUARDAR`, etc.).
   - Piezas atómicas compartidas (como `RotaryKnob.tsx`) se extraen como componentes independientes para reutilizarlas entre módulos.

2. **Hooks de lógica encapsulada (`use<Feature><Dominio>.ts`)**:
   - Extrae efectos pesados, listeners externos (WaveSurfer, MediaRecorder, Web Audio, WebSockets, teclado) y estados acoplados a hooks dedicados dentro de la misma subcarpeta.

3. **Constantes, persistencia y utilidades puras (`src/lib/<dominio>/*.ts`)**:
   - Catálogos, constantes de configuración, helpers de `localStorage`, formateadores y funciones matemáticas/DSP puras viven en `src/lib/` sin dependencias de React.

4. **Componente Padre Orquestador (`<Feature>Modal.tsx`)**:
   - Mantiene el estado compartido mínimo, coordina los hooks y ensambla las secciones pasándoles props explícitas y tipadas.
   - Objetivo de tamaño: mantener los subcomponentes entre **80 y 350 líneas** y el padre limpio y legible (idealmente **< 600–800 líneas**).

## Reglas Complementarias Obligatorias

- **Sin archivos barril monolíticos (`index.ts`)**: importar y exportar cada módulo directamente por su ruta (regla `direct-domain-types`).
- **Aislamiento de modales**: el componente padre de todo modal usa `useModalIsolation` (regla `modal-focus-isolation`).
- **Seguridad de Grid y Flex**: cada subcomponente con grillas o texto truncado aplica `minmax(0, 1fr)` y `minWidth: 0` (regla `css-grid-flex-overflow-guard`).

## Referencias Implementadas en el Proyecto

- **C-Sampler**:
  - Padre: `src/components/studio/plugins/CSamplerPluginModal.tsx`
  - Secciones: `src/components/studio/plugins/sampler/{RotaryKnob,SamplerHeaderBar,SamplerTopBar,SamplerWaveformToolbar,SamplerControlsStrip,SamplerCuePadsGrid}.tsx`
  - Hooks: `src/components/studio/plugins/sampler/{useSamplerWaveform,useSamplerRecorder}.ts`
  - Utilidades: `src/lib/studio/{samplerConstants,samplerRender}.ts`
- **C-Digger**:
  - Padre: `src/components/studio/plugins/CDiggerModal.tsx`
  - Secciones: `src/components/studio/plugins/digger/{DiggerHeaderBar,DiggerFiltersBar,DiggerPlayerStage,DiggerTrackDossier,DiggerCrateDrawer,DiggerFooterBar}.tsx`
  - Persistencia: `src/lib/studio/diggerStorage.ts`
