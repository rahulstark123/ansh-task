"use client";

import { useEffect } from "react";

export function AppFontResizer() {
  useEffect(() => {
    document.documentElement.classList.add("app-font-scaled");
    return () => {
      document.documentElement.classList.remove("app-font-scaled");
    };
  }, []);

  return null;
}
