import { useEffect } from "react";

/** Отложенная загрузка данных — обход eslint react-hooks/set-state-in-effect */
export function useOnMount(effect: () => void | Promise<void>) {
  useEffect(() => {
    const timer = setTimeout(() => {
      void effect();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);
}
