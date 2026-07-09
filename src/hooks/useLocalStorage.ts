import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * Custom hook to manage and persist simple state in localStorage.
 * Initializes with the default value (to match SSR) and hydrates on mount.
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
        // Fallback for raw non-JSON strings (like activeTheme "PUNK_NEON")
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
      // If it is a string, store it as a raw string to match existing local storage formats
      localStorage.setItem(key, typeof newValue === "string" ? newValue : JSON.stringify(newValue));
      return newValue;
    });
  };

  return [state, setPersistedState];
}

/**
 * Custom hook to manage a list where items can be toggled (liked, favorited, etc.)
 * and their IDs are saved as an array of strings in localStorage.
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
        console.error(`Error parsing localStorage key "${key}"`, e);
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
