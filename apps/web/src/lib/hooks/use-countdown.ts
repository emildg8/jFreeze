import { useEffect, useState } from "react";

/** Обратный отсчёт в секундах (0 = готово). */
export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return {
    seconds,
    setSeconds,
    running: seconds > 0,
  };
}
