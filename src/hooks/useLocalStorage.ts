"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * Hook personalizado para gestionar y persistir estado simple en localStorage.
 * Se inicializa con el valor por defecto (para coincidir con SSR) y se hidrata al montar.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved) as T;
        const timer = setTimeout(() => {
          setState(parsed);
        }, 0);
        return () => clearTimeout(timer);
      } catch {
        // Respaldar cadenas de texto plano que no son JSON (ej. activeTheme "PUNK_NEON")
        const timer = setTimeout(() => {
          setState(saved as unknown as T);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [key]);

  const setPersistedState: Dispatch<SetStateAction<T>> = (value) => {
    setState((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      // Si es una cadena, guardar como texto plano para coincidir con formatos existentes
      localStorage.setItem(key, typeof newValue === "string" ? newValue : JSON.stringify(newValue));
      return newValue;
    });
  };

  return [state, setPersistedState];
}

/**
 * Hook personalizado para gestionar una lista donde los elementos se pueden conmutar (me gusta, favoritos, etc.)
 * y sus IDs se guardan como un arreglo de cadenas en localStorage.
 */
export function useLocalStorageToggle<T extends { id: string }>(
  key: string,
  initialList: T[],
  toggleKey: keyof T
): [T[], (id: string) => void] {
  const [list, setList] = useState<T[]>(initialList);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const timer = setTimeout(() => {
          setList((prev) =>
            prev.map((item) => ({
              ...item,
              [toggleKey]: parsed.includes(item.id),
            }))
          );
        }, 0);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error(`Error al analizar la clave de localStorage "${key}"`, e);
      }
    }
  }, [key, toggleKey]);

  const toggle = (id: string) => {
    setList((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? ({ ...item, [toggleKey]: !item[toggleKey] } as unknown as T)
          : item
      );
      const savedIds = next
        .filter((item) => !!item[toggleKey])
        .map((item) => item.id);
      localStorage.setItem(key, JSON.stringify(savedIds));
      return next;
    });
  };

  return [list, toggle];
}
