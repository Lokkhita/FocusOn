/**
 * Navbar.jsx
 * Main navigation bar. Supports:
 * - Desktop: logo, nav links, theme toggle, user menu
 * - Mobile: hamburger menu with animated slide-down
 * - Dark/light mode aware
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, LayoutDashboard, MessageCircle,
  TrendingUp, Menu, X, LogOut, User, ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import toast from "react-hot-toast";

const navLinks = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/goals",      label: "My Goals",   icon: Target },
  { to: "/mentor",     label: "AI Mentor",  icon: MessageCircle },
  { to: "/progress",   label: "Progress",   icon: TrendingUp },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-surface-200 dark:border-dark-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center
                            shadow-glow-brand group-hover:scale-105 transition-transform duration-200">
              <Target size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
              Focus<span className="gradient-text">On</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-dark-600 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side: theme toggle + user menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                           hover:bg-surface-100 dark:hover:bg-dark-600
                           transition-all duration-200"
              >
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 card py-1 shadow-lg z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-dark-600 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={15} />
                      Profile
                    </Link>
                    <hr className="my-1 border-surface-200 dark:border-dark-500" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden btn-ghost p-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-surface-200 dark:border-dark-500"
          >
            <div className="px-4 py-3 space-y-1 bg-white dark:bg-dark-800">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive(to)
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"
                      : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
