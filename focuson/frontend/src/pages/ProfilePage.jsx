/**
 * ProfilePage.jsx
 * User profile editor: name, bio, skills, theme preference.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2, Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import toast from "react-hot-toast";

const THEME_OPTIONS = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "dark",   label: "Dark",   icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    name:             user?.name || "",
    bio:              user?.profile?.bio || "",
    current_role:     user?.profile?.current_role || "",
    location:         user?.profile?.location || "",
    skills:           (user?.profile?.skills || []).join(", "),
    theme_preference: user?.theme_preference || "system",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        name:             form.name,
        theme_preference: form.theme_preference,
        profile: {
          bio:          form.bio,
          current_role: form.current_role,
          location:     form.location,
          skills:       form.skills.split(",").map(s => s.trim()).filter(Boolean),
        },
      });
      updateUser(res.data.user);
      toast.success("Profile updated ✓");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const setThemePref = (val) => {
    setForm(p => ({ ...p, theme_preference: val }));
    if (val !== "system") {
      // Apply immediately
      if (val !== theme) toggleTheme();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-glow-brand">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="section-title text-2xl">{user?.name}</h1>
            <p className="section-subtitle">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white">Personal Info</h2>

            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div>
              <label className="label">Current Role</label>
              <input className="input" placeholder="e.g. Software Engineer, Student, Entrepreneur" value={form.current_role} onChange={e => setForm(p => ({...p, current_role: e.target.value}))} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="e.g. Dhaka, Bangladesh" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="input resize-none" rows={3} placeholder="Tell us a bit about yourself..." value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} />
            </div>
            <div>
              <label className="label">Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
              <input className="input" placeholder="Python, Machine Learning, React, Public Speaking" value={form.skills} onChange={e => setForm(p => ({...p, skills: e.target.value}))} />
            </div>
          </div>

          {/* Theme Preference */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Theme Preference</h2>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value} type="button"
                  onClick={() => setThemePref(value)}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200
                    ${form.theme_preference === value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400"
                      : "border-surface-200 dark:border-dark-400 text-gray-500 hover:border-brand-300"
                    }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
