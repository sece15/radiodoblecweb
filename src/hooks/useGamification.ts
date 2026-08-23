"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { supabase } from "@/lib/supabase";

export interface ListenerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progressText: string;
}

export interface SpinReward {
  type: "c_coins" | "coupon" | "voice_pass" | "badge";
  amount?: number;
  code?: string;
  label: string;
  icon: string;
}

export const LISTENER_LEVELS = [
  { level: 1, minHours: 0, title: "Oyente Doble C", icon: "📻", color: "#666666" },
  { level: 2, minHours: 2, title: "Sintonía Doble C", icon: "⚡", color: "#0088CC" },
  { level: 3, minHours: 10, title: "Locutor Honorario C", icon: "🎙️", color: "#BA1A1A" },
  { level: 4, minHours: 25, title: "Leyenda Doble C", icon: "🖤", color: "#8A2BE2" },
  { level: 5, minHours: 50, title: "Capitán Doble C", icon: "👑", color: "#FFB000" },
];

export function useGamification(listenedSeconds: number, isPlaying: boolean) {
  // 1. C-Coins (formerly puntos)
  const [cCoins, setCCoins] = useLocalStorage<number>("doblec_c_coins", 2);

  // 2. Streaks (Racha Diaria)
  const [streakDays, setStreakDays] = useLocalStorage<number>("doblec_streak_days", 1);
  const [lastActiveDate, setLastActiveDate] = useLocalStorage<string>("doblec_last_active_date", "");

  // 3. Daily Vinyl Spin
  const [lastSpinDate, setLastSpinDate] = useLocalStorage<string>("doblec_last_spin_date", "");
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState<SpinReward | null>(null);

  // 4. Live C-Drops (Surprise Drops while listening)
  const sessionListeningSecsRef = useRef(0);
  const [activeDrop, setActiveDrop] = useState<{ id: string; amount: number; message: string } | null>(null);

  // Today's date string YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const todayStr = getTodayStr();

  // Streak verification logic
  useEffect(() => {
    if (!lastActiveDate) {
      setLastActiveDate(todayStr);
      setStreakDays(1);
      return;
    }

    if (lastActiveDate !== todayStr) {
      const lastDate = new Date(lastActiveDate);
      const currentDate = new Date(todayStr);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        setStreakDays((prev) => (prev || 1) + 1);
        setLastActiveDate(todayStr);
        // Bonus for continuing streak
        setCCoins((c) => (c || 0) + 1);
      } else if (diffDays > 1) {
        // Broken streak reset
        setStreakDays(1);
        setLastActiveDate(todayStr);
      }
    }
  }, [lastActiveDate, todayStr, setLastActiveDate, setStreakDays, setCCoins]);

  // C-Drop timer while playing (every 20 mins = 1200s of active session)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      sessionListeningSecsRef.current += 1;
      if (sessionListeningSecsRef.current > 0 && sessionListeningSecsRef.current % 1200 === 0 && !activeDrop) {
        setActiveDrop({
          id: `drop_${Date.now()}`,
          amount: 1,
          message: "¡C-DROP EN VIVO! Has estado 20 min en sintonía continua.",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, activeDrop]);

  const claimDrop = useCallback(() => {
    if (activeDrop) {
      setCCoins((prev) => (prev || 0) + activeDrop.amount);
      setActiveDrop(null);
    }
  }, [activeDrop, setCCoins]);

  const dismissDrop = useCallback(() => {
    setActiveDrop(null);
  }, []);

  // Listener Level calculation
  const totalHours = (listenedSeconds || 0) / 3600;
  const currentLevelInfo = useMemo(() => {
    let current = LISTENER_LEVELS[0];
    for (const lvl of LISTENER_LEVELS) {
      if (totalHours >= lvl.minHours) {
        current = lvl;
      }
    }
    return current;
  }, [totalHours]);

  const nextLevelInfo = useMemo(() => {
    const nextIdx = LISTENER_LEVELS.findIndex((l) => l.level === currentLevelInfo.level) + 1;
    return LISTENER_LEVELS[nextIdx] || null;
  }, [currentLevelInfo]);

  const levelProgress = useMemo(() => {
    if (!nextLevelInfo) return 100;
    const range = nextLevelInfo.minHours - currentLevelInfo.minHours;
    const current = totalHours - currentLevelInfo.minHours;
    return Math.min(100, Math.max(0, Math.round((current / (range || 1)) * 100)));
  }, [totalHours, currentLevelInfo, nextLevelInfo]);
  // Daily Spin Logic
  const canSpinToday = lastSpinDate !== todayStr;

  const spinVinyl = useCallback(async (): Promise<SpinReward> => {
    setIsSpinning(true);

    if (supabase) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc("spin_daily_vinyl");
        if (rpcErr || (rpcRes && !rpcRes.success && rpcRes.alreadySpun)) {
          setIsSpinning(false);
          throw new Error(rpcRes?.message || rpcErr?.message || "Ya giraste la tornamesa hoy. ¡Vuelve mañana!");
        }

        if (rpcRes?.success && rpcRes?.reward) {
          const reward: SpinReward = {
            type: rpcRes.reward.type || "c_coins",
            label: rpcRes.reward.label,
            icon: rpcRes.reward.icon,
            amount: rpcRes.reward.amount,
          };
          if (rpcRes.coins !== undefined) {
            setCCoins(rpcRes.coins);
          }
          setLastSpinDate(todayStr);
          setIsSpinning(false);
          setLastReward(reward);
          return reward;
        }
      } catch (err) {
        setIsSpinning(false);
        throw err;
      }
    }

    // Fallback Offline / Local con Probabilidad Estricta:
    if (!canSpinToday) {
      setIsSpinning(false);
      throw new Error("Ya giraste la tornamesa hoy. Vuelve mañana.");
    }

    const rand = Math.random();
    let chosen: SpinReward;

    // Jackpot de 1 a 1,000,000,000 (1 en mil millones)
    if (rand < 1e-9) {
      chosen = { type: "c_coins", amount: 100, label: "¡JACKPOT LEGENDARIO (1 EN 1,000,000,000)! +100 C-Coins ⭐", icon: "👑" };
    } else if (rand < 0.40) {
      chosen = { type: "c_coins", amount: 1, label: "+1 C-Coin Doble C", icon: "🪙" };
    } else if (rand < 0.70) {
      chosen = { type: "coupon", code: "DOBLEC10", label: "+1 C-Coin & Cupón 10% Tienda Oficial", icon: "🏷️", amount: 1 };
    } else {
      chosen = { type: "voice_pass", label: "+1 C-Coin & Pase de Sintonía", icon: "🎙️", amount: 1 };
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        setCCoins((prev) => (prev || 0) + (chosen.amount || 1));
        setLastSpinDate(todayStr);
        setIsSpinning(false);
        setLastReward(chosen);
        resolve(chosen);
      }, 2500);
    });
  }, [canSpinToday, todayStr, setCCoins, setLastSpinDate]);

  return {
    cCoins,
    setCCoins,
    streakDays,
    currentLevelInfo,
    nextLevelInfo,
    levelProgress,
    totalHours,
    canSpinToday,
    isSpinning,
    lastReward,
    spinVinyl,
    activeDrop,
    claimDrop,
    dismissDrop,
  };
}
