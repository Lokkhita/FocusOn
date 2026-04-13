/**
 * LoginPage.jsx
 * Secure login with:
 * - Client-side validation
 * - Error display from API
 * - Animated entrance
 * - Link to register
 */

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Target, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ui/ThemeToggle";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Enter a valid email address";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 👋");
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Cannot reach the API. In the focuson folder run: npm run dev (or npm run server)"
          : err.message) ||
        "Invalid credentials";
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || { email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
    },
  });

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-dark-900 bg-mesh-light dark:bg-mesh-dark">

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-500 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-white" />
          <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">FocusOn</span>
          </div>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">AI Goal Mentor</p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
              Turn your goals into<br />
              <span className="text-accent-400">reality.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-md">
              FocusOn uses AI to understand your unique situation, generate real-world strategies, and guide you every step of the way.
            </p>
          </motion.div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-5">
          <p className="text-white/90 text-sm italic leading-relaxed">
            "FocusOn helped me transition from marketing to AI engineering in 8 months. The roadmap was incredibly precise."
          </p>
          <p className="text-white/60 text-xs mt-2 font-medium">— Sarah K., AI Engineer at a Fortune 500</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Theme toggle top-right */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
              Focus<span className="gradient-text">On</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
              Sign up free →
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
                {...field("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                  {...field("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-brand-500">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="underline hover:text-brand-500">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
