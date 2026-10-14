"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext =
  createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "eduquest-theme";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>("dark");

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(STORAGE_KEY);

    const initialTheme: Theme =
      savedTheme === "light"
        ? "light"
        : "dark";

    setThemeState(initialTheme);

    document.documentElement.setAttribute(
      "data-theme",
      initialTheme
    );
  }, []);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);

    document.documentElement.setAttribute(
      "data-theme",
      nextTheme
    );

    localStorage.setItem(
      STORAGE_KEY,
      nextTheme
    );
  }

  function toggleTheme() {
    setTheme(
      theme === "dark"
        ? "light"
        : "dark"
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}