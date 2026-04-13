/**
 * ThemeToggle.jsx
 * Animated sun/moon toggle button for dark/light mode.
 * Uses CSS transforms for smooth icon transition.
 */

import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ size = "md" }) {
  const { isDark, toggleTheme } = useTheme();

  const sizes = {
    sm: { btn: "p-1.5", icon: 14 },
    md: { btn: "p-2",   icon: 16 },
    lg: { btn: "p-2.5", icon: 18 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${s.btn} rounded-xl
        bg-surface-100 dark:bg-dark-600
        border border-surface-200 dark:border-dark-400
        text-gray-600 dark:text-gray-300
        hover:bg-surface-200 dark:hover:bg-dark-500
        hover:text-brand-500 dark:hover:text-brand-400
        transition-all duration-200
        relative overflow-hidden`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Moon size={s.icon} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Sun size={s.icon} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
