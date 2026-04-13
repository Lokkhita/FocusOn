/**
 * ProgressPage.jsx — Progress overview with charts
 */
import { TrendingUp, Target, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="section-title text-2xl mb-1">Progress Tracker</h1>
      <p className="section-subtitle mb-8">Your journey toward every goal, visualized.</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Flame, label: "Day Streak", value: "7 days", color: "bg-orange-500" },
          { icon: Target, label: "Milestones Done", value: "12", color: "bg-brand-500" },
          { icon: TrendingUp, label: "Avg. Progress", value: "35%", color: "bg-green-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <p className="font-display text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </motion.div>
        ))}
      </div>
      <div className="card p-6 text-center">
        <TrendingUp size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="font-display font-semibold text-gray-600 dark:text-gray-300 mb-1">Detailed charts coming soon</p>
        <p className="text-sm text-gray-400">Log progress on your goals to see trends here.</p>
      </div>
    </div>
  );
}
