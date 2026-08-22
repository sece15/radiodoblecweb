"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/hooks/useAudio";

export function useSleepTimer() {
  const { isPlaying, togglePlayPause } = useAudio();
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback((minutes: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const totalSecs = minutes * 60;
    setTimerMinutes(minutes);
    setSecondsRemaining(totalSecs);
    setIsActive(true);
  }, []);

  const cancelTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsActive(false);
    setTimerMinutes(null);
    setSecondsRemaining(0);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsActive(false);
          setTimerMinutes(null);
          // Turn off radio smoothly if playing
          if (isPlaying) {
            togglePlayPause();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPlaying, togglePlayPause]);

  const formattedTime = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(secondsRemaining % 60).toString().padStart(2, "0")}`;

  return {
    isActive,
    timerMinutes,
    secondsRemaining,
    formattedTime,
    startTimer,
    cancelTimer,
  };
}
