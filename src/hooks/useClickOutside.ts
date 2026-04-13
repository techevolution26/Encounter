"use client";

import { RefObject, useEffect } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void
) {
  useEffect(() => {
    function handleEvent(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;

      if (!ref.current || !target) return;
      if (ref.current.contains(target)) return;

      onOutside();
    }

    document.addEventListener("mousedown", handleEvent);
    document.addEventListener("touchstart", handleEvent);

    return () => {
      document.removeEventListener("mousedown", handleEvent);
      document.removeEventListener("touchstart", handleEvent);
    };
  }, [ref, onOutside]);
}