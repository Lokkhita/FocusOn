/**
 * RegisterPage.jsx
 * Registration form — mirrors LoginPage structure.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Target, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ui/ThemeToggle";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Enter a valid email";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.password_confirmation) errs.password_confirmation = "Passwords don't match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.password_confirmation);
      toast.success("Welcome to FocusOn! Let's set your first goal 🎯");
      navigate("/goals/new");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Cannot reach the API. In the focuson folder run: npm run dev (or npm run server)"
          : err.message) ||
        "Registration failed";
      if (err.response?.status === 422) {
        const raw = err.response.data?.errors || {};
        const next = {};
        for (const [key, val] of Object.entries(raw)) {
          next[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(Object.keys(next).length ? next : { email: msg });
      } else toast.error(msg);
    } finally { setLoading(false); }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm(p => ({ ...p, [key]: e.target.value })); if (errors[key]) setErrors(p => ({ ...p, [key]: undefined })); },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark-900 bg-mesh-light dark:bg-mesh-dark px-4">
      <div className="absolute top-5 right-5"><ThemeToggle /></div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center"><Target size={16} className="text-white" /></div>
          <span className="font-display font-bold text-xl text-gray-900 dark:text-white">Focus<span className="gradient-text">On</span></span>
        </div>
        <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">Create your account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Already have one?{" "}
          <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">Sign in →</Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label">Full Name</label>
            <input className={`input ${errors.name ? "border-red-400" : ""}`} placeholder="Nadia Rahman" {...field("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className={`input ${errors.email ? "border-red-400" : ""}`} placeholder="you@example.com" {...field("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} className={`input pr-10 ${errors.password ? "border-red-400" : ""}`} placeholder="Min 8 characters" {...field("password")} />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className={`input ${errors.password_confirmation ? "border-red-400" : ""}`} placeholder="Repeat password" {...field("password_confirmation")} />
            {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-gray-400">
          By signing up, you agree to our <Link to="/terms" className="underline hover:text-brand-500">Terms</Link> and <Link to="/privacy" className="underline hover:text-brand-500">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
