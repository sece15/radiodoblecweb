"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to keep the device screen awake (Screen Wake Lock API)
 * Prevents mobile screens from turning off while on the radio page or playing audio.
 */
export function useWakeLock(isActive: boolean = true) {
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return "wakeLock" in navigator;
  });

  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!isSupported || !isActive) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
      return;
    }

    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && !wakeLockRef.current) {
          const lock = await navigator.wakeLock.request("screen");
          if (isMounted) {
            wakeLockRef.current = lock;
            setIsLocked(true);

            lock.addEventListener("release", () => {
              if (isMounted) {
                setIsLocked(false);
                wakeLockRef.current = null;
              }
            });
          }
        }
      } catch {
        // Ignored if device is low on battery or permissions denied
      }
    };

    requestWakeLock();

    // Automatically re-request wake lock when user switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    };
  }, [isSupported, isActive]);

  return { isSupported, isLocked };
}
