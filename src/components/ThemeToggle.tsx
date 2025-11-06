// src/components/ThemeToggle.tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-2xl border px-3 py-2 text-sm shadow-sm"
    >
      <motion.span whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
        {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? "라이트" : "다크"}
      </motion.span>
    </button>
  );
}

