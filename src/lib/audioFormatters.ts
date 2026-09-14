/**
 * Utilidades para formateo de tiempos de audio en Radio Doble C
 */

export const formatTime = (secs: number): string => {
  if (secs < 0) return secs.toString(); // e.g. -15:00
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatProgressTime = (
  isLive: boolean,
  progress: number,
  currentTime: number,
  totalTime: number
): string => {
  if (isLive) {
    if (progress >= 0.95) {
      return "LIVE";
    } else {
      const offsetSecs = Math.round((progress - 1) * totalTime);
      return formatTime(offsetSecs);
    }
  }
  return formatTime(currentTime);
};

export const formatTotalTime = (isLive: boolean, totalTime: number): string => {
  if (isLive) return "LIVE";
  return formatTime(totalTime);
};
