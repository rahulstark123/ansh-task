"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PrimaryColor = 
  | "Ocean" 
  | "Mood Indigo" 
  | "Graphite" 
  | "Jade" 
  | "Aubergine" 
  | "Barbara" 
  | "Clementine" 
  | "Lagoon";

export type ColorPalette = {
  primary: string;
  hover: string;
  foreground: string;
  softLight: string;
  softDark: string;
  softTextLight: string;
  softTextDark: string;
  softBorderLight: string;
  softBorderDark: string;
  gradientFrom: string;
  gradientTo: string;
  focusBorder: string;
  ring: string;
};

export const PALETTES: Record<PrimaryColor, ColorPalette> = {
  Ocean: {
    primary: "#2563eb",
    hover: "#1d4ed8",
    foreground: "#ffffff",
    softLight: "#eff6ff",
    softDark: "rgba(59, 130, 246, 0.08)",
    softTextLight: "#1e40af",
    softTextDark: "#93c5fd",
    softBorderLight: "#dbeafe",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#3b82f6",
    gradientTo: "#1d4ed8",
    focusBorder: "#60a5fa",
    ring: "rgba(37, 99, 235, 0.18)",
  },
  "Mood Indigo": {
    primary: "#4f46e5",
    hover: "#4338ca",
    foreground: "#ffffff",
    softLight: "#e0e7ff",
    softDark: "rgba(99, 102, 241, 0.08)",
    softTextLight: "#3730a3",
    softTextDark: "#a5b4fc",
    softBorderLight: "#c7d2fe",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#6366f1",
    gradientTo: "#4338ca",
    focusBorder: "#818cf8",
    ring: "rgba(79, 70, 229, 0.18)",
  },
  Graphite: {
    primary: "#4b5563",
    hover: "#374151",
    foreground: "#ffffff",
    softLight: "#f3f4f6",
    softDark: "rgba(107, 114, 128, 0.08)",
    softTextLight: "#1f2937",
    softTextDark: "#d1d5db",
    softBorderLight: "#e5e7eb",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#6b7280",
    gradientTo: "#374151",
    focusBorder: "#9ca3af",
    ring: "rgba(75, 85, 99, 0.18)",
  },
  Jade: {
    primary: "#0d9488",
    hover: "#0f7669",
    foreground: "#ffffff",
    softLight: "#ecfdf7",
    softDark: "rgba(20, 184, 166, 0.08)",
    softTextLight: "#115e59",
    softTextDark: "#99f6e4",
    softBorderLight: "#c4f0e8",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#14b8a6",
    gradientTo: "#0f7669",
    focusBorder: "#2dd4bf",
    ring: "rgba(13, 148, 136, 0.18)",
  },
  Aubergine: {
    primary: "#7c3aed",
    hover: "#6d28d9",
    foreground: "#ffffff",
    softLight: "#f5f3ff",
    softDark: "rgba(139, 92, 246, 0.08)",
    softTextLight: "#5b21b6",
    softTextDark: "#c4b5fd",
    softBorderLight: "#ddd6fe",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#8b5cf6",
    gradientTo: "#6d28d9",
    focusBorder: "#a78bfa",
    ring: "rgba(124, 58, 237, 0.18)",
  },
  Barbara: {
    primary: "#db2777",
    hover: "#be185d",
    foreground: "#ffffff",
    softLight: "#fdf2f8",
    softDark: "rgba(236, 72, 153, 0.08)",
    softTextLight: "#9d174d",
    softTextDark: "#fbcfe8",
    softBorderLight: "#fce7f3",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#ec4899",
    gradientTo: "#be185d",
    focusBorder: "#f472b6",
    ring: "rgba(219, 39, 119, 0.18)",
  },
  Clementine: {
    primary: "#ea580c",
    hover: "#c2410c",
    foreground: "#ffffff",
    softLight: "#fff7ed",
    softDark: "rgba(249, 115, 22, 0.08)",
    softTextLight: "#9a3412",
    softTextDark: "#ffedd5",
    softBorderLight: "#ffedd5",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#f97316",
    gradientTo: "#c2410c",
    focusBorder: "#fb923c",
    ring: "rgba(234, 88, 12, 0.18)",
  },
  Lagoon: {
    primary: "#0891b2",
    hover: "#0e7490",
    foreground: "#ffffff",
    softLight: "#ecfeff",
    softDark: "rgba(6, 182, 212, 0.08)",
    softTextLight: "#0f766e",
    softTextDark: "#a5f3fc",
    softBorderLight: "#cffafe",
    softBorderDark: "rgba(255, 255, 255, 0.09)",
    gradientFrom: "#06b6d4",
    gradientTo: "#0e7490",
    focusBorder: "#22d3ee",
    ring: "rgba(8, 145, 178, 0.18)",
  }
};

type AppearanceContextType = {
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
  isAppearanceOpen: boolean;
  setIsAppearanceOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>("Jade");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ansh-primary-color") as PrimaryColor;
    if (saved && PALETTES[saved]) {
      setPrimaryColor(saved);
    }
    const savedCollapse = localStorage.getItem("ansh-sidebar-collapsed");
    if (savedCollapse === "true") {
      setIsSidebarCollapsedState(true);
    }
  }, []);

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem("ansh-sidebar-collapsed", collapsed ? "true" : "false");
  };

  // Apply to document variables whenever primaryColor changes
  useEffect(() => {
    const palette = PALETTES[primaryColor];
    const root = document.documentElement;

    root.style.setProperty("--app-primary", palette.primary);
    root.style.setProperty("--app-primary-hover", palette.hover);
    root.style.setProperty("--app-primary-foreground", palette.foreground);
    root.style.setProperty("--app-gradient-from", palette.gradientFrom);
    root.style.setProperty("--app-gradient-to", palette.gradientTo);
    root.style.setProperty("--app-focus-border", palette.focusBorder);
    root.style.setProperty("--app-ring", palette.ring);

    // Apply dark/light-specific variables
    // For soft backgrounds, text, and borders:
    // Update them dynamically
    const updateThemeDependentVars = () => {
      const isDark = root.classList.contains("dark");
      root.style.setProperty(
        "--app-primary-soft", 
        isDark ? palette.softDark : palette.softLight
      );
      root.style.setProperty(
        "--app-primary-soft-text", 
        isDark ? palette.softTextDark : palette.softTextLight
      );
      root.style.setProperty(
        "--app-primary-soft-border", 
        isDark ? palette.softBorderDark : palette.softBorderLight
      );
    };

    updateThemeDependentVars();

    // Set up MutationObserver to listen to class changes (.dark toggles)
    const observer = new MutationObserver(updateThemeDependentVars);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Save to localStorage
    localStorage.setItem("ansh-primary-color", primaryColor);

    return () => observer.disconnect();
  }, [primaryColor]);

  return (
    <AppearanceContext.Provider 
      value={{ 
        primaryColor, 
        setPrimaryColor, 
        isAppearanceOpen, 
        setIsAppearanceOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}
