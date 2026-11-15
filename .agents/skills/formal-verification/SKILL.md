---
name: formal-verification
description: >-
  Metodología de verificación formal, diseño por contratos (Design by Contract) e invariantes matemáticas.
  Úsalo para modelar matemáticamente el estado, definir invariantes, simular transiciones y validar
  la corrección absoluta de cualquier módulo o feature antes de escribir código de producción.
---

# Formal Verification & Invariant-Driven Architecture Skill

Este skill define la metodología inspirada en demostradores de teoremas interactivos (**Lean 4, TLA+, Alloy, Z3**) para validar y blindar sistemas de software **antes** de codificar la interfaz o la infraestructura.

---

## 1. Filosofía: Demostración vs. Testing Tradicional

- **El Problema del Testing Tradicional**:
  - Un test unitario o E2E evalúa un puñado de entradas fijas ($10$ o $20$ casos).
  - En sistemas concurrentes, interactivos o con estado distribuido, el espacio de combinaciones posibles es infinito ($2^N$).
  - Los tests solo demuestran que el código funciona para los casos que el desarrollador recordó contemplar.

- **La Solución por Verificación Formal**:
  - Definir **Invariantes Matemáticas** ($\text{Inv}(S)$): condiciones que deben cumplirse en el estado inicial y preservarse en **todas** las transiciones posibles.
  - Si $\text{Inv}(S) \land \text{Action}(S \to S') \implies \text{Inv}(S')$, el sistema es matemáticamente incapaz de entrar en un estado corrupto o inválido.
  - **Optimización Extrema sin Miedo**: Al tener la certeza de los invariantes, se pueden eliminar chequeos defensivos repetitivos y acceder a rutas directas de ultra alto rendimiento (como el salto directo al B-Tree de SQLite visto en Lean 4).

---

## 2. Los 3 Pilares del Diseño por Contratos (DbC)

Para cada funcionalidad, define explícitamente:

1. **Pre-condiciones (`requires`)**:
   - Qué debe ser estrictamente cierto antes de invocar la operación.
   - Si la pre-condición falla, la operación se rechaza de inmediato (Fail-Fast).
2. **Post-condiciones (`ensures`)**:
   - Qué garantiza la función que será cierto tras finalizar la operación.
3. **Invariantes de Sistema (`invariant`)**:
   - Propiedades globales inmutables del estado en reposo.

---

## 3. Ejemplo Práctico: Invariantes de Dominio en Audio/Studio

En un Sampler de cortes sucesivos (estilo Serato Sample / MPC):

1. **Invariante $I_1$ (Orden Cronológico Estricto)**:
   $$\forall 0 \le i < n - 1: \quad \text{cue}[i].\text{startSec} < \text{cue}[i+1].\text{startSec}$$
2. **Invariante $I_2$ (Delimitación Sucesiva sin Huecos)**:
   $$\text{endLimit}(i) = \begin{cases} \text{cue}[i+1].\text{startSec} & \text{si } i < n - 1 \\ \text{TotalDuration} & \text{si } i = n - 1 \end{cases}$$
3. **Invariante $I_3$ (Espaciado Mínimo de Prevención de Colisión)**:
   $$\text{cue}[i+1].\text{startSec} - \text{cue}[i].\text{startSec} \ge \delta_{\min} \quad (\text{ej. } 0.1\,\text{s})$$
4. **Invariante $I_4$ (Isomorfismo Temporal de Resampling por Pitch)**:
   $$\text{Duration}_{\text{real}} = \frac{\text{Duration}_{\text{natural}}}{2^{\frac{\Delta\text{semi}}{12}}}$$

---

## 4. Pipeline de Pre-Validación (Paso a Paso)

Cuando el usuario pida analizar una nueva arquitectura o validar una feature crítica:

### Paso 1: Extracción de Invariantes

- Identifica las entidades y variables críticas del estado.
- Escribe en lenguaje formal o pseudocódigo matemático las propiedades que **nunca** deben violarse.

### Paso 2: Definición de Transiciones Válidas (FSM)

- Mapea las acciones posibles como una máquina de estados finitos:
  $$\text{State}_{t+1} = f(\text{State}_t, \text{Event})$$
- Bloquea en los contratos cualquier transición que no preserve los invariantes.

### Paso 3: Simulación por Propiedades (Property-Based Simulation)

- Construye un script ligero de simulación (usando Bun / TypeScript).
- Ejecuta un bucle de fuzzing con miles ($10,000+$) de acciones aleatorias consecutivas (creación, arrastre, eliminación, reordenamiento, pitch cambiante).
- Verifica tras cada micro-paso que todos los invariantes sigan dando `true`.

### Paso 4: Generación de Guardas en Producción

- Expón funciones puras que calculen los límites seguros antes de que la UI los aplique (ej. `calculateSafeDragBounds`).
- En desarrollo o tests, activa assertions duras. En producción, el código ejecuta la ruta más rápida y optimizada con la certeza de que los datos son válidos.
