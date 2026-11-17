"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

// Pila global de modales abiertos para garantizar que solo el modal superior
// capture el teclado (Space, Escape, Tab, atajos) y bloquee la página principal.
const openModalStack: symbol[] = [];
let previousBodyOverflow: string | null = null;

function isEditableElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export interface UseModalIsolationOptions {
  /** Callback al presionar Escape cuando este modal está activo al frente. */
  onEscape?: () => void;
  /** Callback al presionar Space (fuera de inputs) cuando este modal está activo al frente. */
  onSpace?: () => void;
  /** Si debe bloquear el scroll del body mientras haya un modal abierto (default: true). */
  lockScroll?: boolean;
  /** Si debe capturar Space globalmente para evitar que active botones de la página principal (default: true). */
  captureSpace?: boolean;
}

/**
 * Aísla un modal de la página principal y de modales inferiores:
 * - Mueve el foco dentro del modal al abrir y desenfoca elementos de fondo.
 * - Mantiene el foco atrapado con Tab dentro del modal superior.
 * - Bloquea el scroll del documento mientras haya modales abiertos.
 * - Intercepta Escape / Space en fase de captura para que no disparen Play/Pause ni botones de la página principal.
 */
export function useModalIsolation(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  options: UseModalIsolationOptions = {}
) {
  const {
    onEscape,
    onSpace,
    lockScroll = true,
    captureSpace = true,
  } = options;

  const modalIdRef = useRef<symbol | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  const onSpaceRef = useRef(onSpace);
  onEscapeRef.current = onEscape;
  onSpaceRef.current = onSpace;

  const isTopModal = useCallback(() => {
    if (!modalIdRef.current || openModalStack.length === 0) return false;
    return openModalStack[openModalStack.length - 1] === modalIdRef.current;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol("modal");
    modalIdRef.current = id;
    openModalStack.push(id);

    // Guardar el elemento previo y mover el foco al modal para que Space/Enter no disparen botones del fondo
    const activeEl = document.activeElement as HTMLElement | null;
    previousFocusRef.current = activeEl;
    if (activeEl && containerRef.current && !containerRef.current.contains(activeEl)) {
      activeEl.blur();
    }

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(document.activeElement)) {
        container.focus({ preventScroll: true });
      }
    }, 0);

    if (lockScroll && openModalStack.length === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      if (openModalStack[openModalStack.length - 1] !== id) return;

      const container = containerRef.current;
      const editable = isEditableElement(e.target);

      // Si el foco sigue fuera del modal, desenfocarlo inmediatamente
      if (container && document.activeElement instanceof HTMLElement && !container.contains(document.activeElement)) {
        document.activeElement.blur();
        container.focus({ preventScroll: true });
      }

      if (e.code === "Escape" && onEscapeRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onEscapeRef.current();
        return;
      }

      if (e.code === "Tab" && container) {
        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          e.preventDefault();
          container.focus({ preventScroll: true });
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if (e.code === "Space" && captureSpace && !editable) {
        if (onSpaceRef.current) {
          e.preventDefault();
          e.stopPropagation();
          onSpaceRef.current();
        } else if (container && !container.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener("keydown", handleCaptureKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleCaptureKeyDown, true);

      const idx = openModalStack.indexOf(id);
      if (idx !== -1) {
        openModalStack.splice(idx, 1);
      }
      modalIdRef.current = null;

      if (lockScroll && openModalStack.length === 0 && previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
      }

      // Restaurar foco solo cuando se cierra el último modal y el elemento previo sigue en el DOM
      if (
        openModalStack.length === 0 &&
        previousFocusRef.current &&
        document.contains(previousFocusRef.current)
      ) {
        try {
          previousFocusRef.current.focus({ preventScroll: true });
        } catch {}
      }
    };
  }, [isOpen, containerRef, lockScroll, captureSpace]);

  return { isTopModal };
}
