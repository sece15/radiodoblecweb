---
name: direct-domain-types
description: >-
  Patrón estricto de arquitectura para tipos e interfaces TypeScript basado en archivos de dominio directo (ej. src/types/news.ts).
  Prohíbe totalmente el uso de archivos barril monolíticos (como index.ts) y fuerza la exportación e importación
  100% directa desde cada archivo de dominio (@/types/<dominio>).
---

# Direct Domain Types Pattern (Patrón Estricto de Tipos por Dominio Directo)

Este skill define la convención estricta para organizar tipos e interfaces TypeScript en el proyecto, siguiendo el modelo de referencia de `src/types/news.ts`.

---

## 1. Principios Fundamentales
* **Cada dominio tiene su propio archivo exclusivo:** Todos los tipos e interfaces relacionados con una funcionalidad o entidad viven en `src/types/<dominio>.ts` (por ejemplo: `news.ts`, `radio.ts`, `user.ts`, `shop.ts`, `chat.ts`).
* **PROHIBIDO el archivo `index.ts` (Zero Barrel):** No debe existir `src/types/index.ts`. No se permiten archivos barril que acumulen, re-exporten o hagan de puente entre dominios.
* **Exportación e Importación 100% Directa:** Cada consumidor (componente, hook, servicio, página, ruta de API) debe importar única y exclusivamente desde el archivo del dominio correspondiente: `@/types/<dominio>`.

---

## 2. Estructura de Carpetas (Sin `index.ts`)

```text
src/types/
├── news.ts      # Noticias, categorías y respuestas de API
├── radio.ts     # Señal en vivo, estaciones, canciones, now playing, playback, horarios
├── user.ts      # Perfil de usuario, roles, permisos, gamificación, insignias
├── chat.ts      # Mensajería en vivo, moderación, sockets, saludos Luna
└── shop.ts      # Productos, carrito, pedidos, cupones, patrocinadores, MercadoPago
```

---

## 3. Reglas de Importación

### ✅ Lo que SIEMPRE se debe hacer (Importación Directa):
```typescript
// Importar siempre directo del archivo de dominio correspondiente
import type { NewsItem, NewsCategory } from "@/types/news";
import type { Station, TrackInfo, NowPlayingStationPayload } from "@/types/radio";
import type { UserProfile, UserRole } from "@/types/user";
import type { ChatMessage, VoiceGreeting } from "@/types/chat";
import type { Product, CartItem } from "@/types/shop";
```

### ❌ Lo que NUNCA se debe hacer (Anti-patrones Prohibidos):
1. **Crear o revivir un `index.ts`:**
   ```typescript
   // ❌ PROHIBIDO
   import { Station, UserProfile } from "@/types";
   ```
2. **Re-exportar en cascada:**
   No crear un archivo que haga `export * from "./radio"`. Las consultas y enlaces deben ser directos y atómicos.
3. **Declarar interfaces de entidades inline dentro de componentes o rutas:**
   ```typescript
   // ❌ PROHIBIDO declarar tipos globales dentro de un componente o route.ts:
   // En src/app/api/radio/route.ts:
   interface NowPlayingStationPayload { ... } // Debe vivir en src/types/radio.ts
   ```

---

## 4. Checklist para Nuevas Funcionalidades
1. Identificar el dominio de la entidad (ej. radio, tienda, usuario, chat, noticias).
2. Si el dominio ya existe, abrir `src/types/<dominio>.ts` y añadir la interfaz exportada.
3. Si es un dominio completamente nuevo, crear `src/types/<nuevo-dominio>.ts`.
4. En el archivo consumidor, importar directamente: `import type { MiInterfaz } from "@/types/<dominio>";`.
