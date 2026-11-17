"use client";

import { useEffect } from "react";

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

export const AppVersionWatcher = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !CLIENT_VERSION || CLIENT_VERSION === "dev") {
      return;
    }

    let isChecking = false;

    const checkForNewBuild = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        const serverVersion = data?.version;
        if (!serverVersion || serverVersion === "dev" || serverVersion === CLIENT_VERSION) {
          return;
        }

        const guardKey = `doblec_reloaded_for_${serverVersion}`;
        if (window.sessionStorage.getItem(guardKey)) {
          return;
        }
        window.sessionStorage.setItem(guardKey, "1");

        // Solo al detectar un deploy nuevo: limpiar cachés web antiguas (respetando c-studio-*)
        if (typeof caches !== "undefined") {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((name) => !name.startsWith("c-studio-"))
              .map((name) => caches.delete(name))
          );
        }

        window.location.reload();
      } catch {
        // Ignorar errores de red temporales
      } finally {
        isChecking = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForNewBuild();
      }
    };

    window.addEventListener("focus", checkForNewBuild);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(checkForNewBuild, 3 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", checkForNewBuild);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, []);

  return null;
};
