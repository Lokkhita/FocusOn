/**
 * GoalWizard.jsx
 * Multi-step AI-powered goal creation:
 *  Step 1: Define the goal (title, category, description)
 *  Step 2: AI asks clarifying questions → user answers
 *  Step 3: AI analyzes situation → review SWOT
 *  Step 4: AI generates strategic paths → user picks one
 *  Step 5: AI generates full roadmap → save & go
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Brain, Map, Route, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Sparkles, Star
} from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const STEPS = [
  { id: 1, label: "Define",    icon: Target,      desc: "What's your goal?" },
  { id: 2, label: "Clarify",   icon: Brain,        desc: "AI questions" },
  { id: 3, label: "Analyze",   icon: Map,          desc: "Your situation" },
  { id: 4, label: "Paths",     icon: Route,        desc: "Choose strategy" },
  { id: 5, label: "Roadmap",   icon: CheckCircle2, desc: "Your plan" },
];

const CATEGORIES = ["career", "education", "health", "finance", "personal", "startup"];

// ── Step 1: Goal definition form ──
function Step1({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Goal Title *</label>
        <input
          className="input"
          placeholder='e.g. "Become a Senior AI Engineer in 12 months"'
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">Be specific — the more detail, the better your roadmap.</p>
      </div>

      <div>
        <label className="label">Category *</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ category: cat })}
              className={`py-2 px-3 rounded-xl text-sm font-medium capitalize border transition-all duration-150
                ${data.category === cat
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400"
                  : "border-surface-200 dark:border-dark-400 text-gray-600 dark:text-gray-400 hover:border-brand-300"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Describe what success looks like for you..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Target Timeframe</label>
        <select className="input" value={data.timeframe} onChange={(e) => onChange({ timeframe: e.target.value })}>
          <option value="">Select a timeframe...</option>
          <option value="3_months">3 months</option>
          <option value="6_months">6 months</option>
          <option value="12_months">12 months</option>
          <option value="2_years">2 years</option>
          <option value="open_ended">Open-ended</option>
        </select>
      </div>
    </div>
  );
}

// ── Step 2: AI clarifying questions ──
function Step2({ questions, answers, onAnswer, loading }) {
  if (loading) return (
    <div className="text-center py-12">
      <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
      <p className="font-display font-semibold text-gray-700 dark:text-gray-300">AI is analyzing your goal...</p>
      <p className="text-sm text-gray-400 mt-1">Generating targeted questions to understand your situation</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800">
        <Sparkles size={16} className="text-brand-500 flex-shrink-0" />
        <p className="text-sm text-brand-700 dark:text-brand-400">
          Answer these to help AI understand your unique situation. No wrong answers.
        </p>
      </div>

      {questions.map((q, i) => (
        <div key={i}>
          <label className="label">
            <span className="text-brand-500 font-mono text-xs mr-1">Q{i + 1}.</span> {q}
          </label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Your answer..."
            value={answers[i] || ""}
            onChange={(e) => onAnswer(i, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Step 3: Situation analysis (SWOT) ──
function Step3({ analysis, loading }) {
  if (loading) return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-2xl bg-brand-500 mx-auto mb-3 flex items-center justify-center animate-pulse">
        <Brain size={24} className="text-white" />
      </div>
      <p className="font-display font-semibold text-gray-700 dark:text-gray-300">Analyzing your situation...</p>
      <p className="text-sm text-gray-400 mt-1">Identifying strengths, gaps, and opportunities</p>
    </div>
  );

  const cards = [
    { title: "Strengths",     items: analysis?.strengths,     color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",  dot: "bg-green-500" },
    { title: "Opportunities", items: analysis?.opportunities, color: "bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800",  dot: "bg-brand-500" },
    { title: "Weaknesses",    items: analysis?.weaknesses,    color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",  dot: "bg-amber-500" },
    { title: "Challenges",    items: analysis?.challenges,    color: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",          dot: "bg-red-500" },
  ];

  return (
    <div className="space-y-4">
      {analysis?.ai_summary && (
        <div className="card p-4 bg-gradient-to-br from-brand-50 to-surface-50 dark:from-brand-950/30 dark:to-dark-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"{analysis.ai_summary}"</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {cards.map(({ title, items, color, dot }) => (
          <div key={title} className={`card p-4 border ${color}`}>
            <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} /> {title}
            </h4>
            <ul className="space-y-1.5">
              {(items || []).map((item, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 4: Strategic path selection ──
function Step4({ paths, selectedPath, onSelect, loading }) {
  if (loading) return (
    <div className="text-center py-12">
      <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
      <p className="font-display font-semibold text-gray-700 dark:text-gray-300">Generating strategic paths...</p>
      <p className="text-sm text-gray-400 mt-1">Researching market demand and success patterns</p>
    </div>
  );

  const difficultyColors = { beginner: "badge-success", intermediate: "badge-warning", advanced: "badge-brand" };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        AI generated <strong className="text-gray-900 dark:text-white">{paths.length} strategic paths</strong> based on your situation and market demand. Choose the one that fits you best.
      </p>
      {paths.map((path) => (
        <button
          key={path.path_id}
          onClick={() => onSelect(path.path_id)}
          className={`w-full text-left card p-5 transition-all duration-200 group
            ${selectedPath === path.path_id
              ? "border-2 border-brand-500 shadow-glow-brand"
              : "hover:border-brand-300 dark:hover:border-brand-700"
            }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-gray-900 dark:text-white">{path.title}</span>
              <span className={`badge ${difficultyColors[path.difficulty]}`}>{path.difficulty}</span>
              <span className="badge badge-brand capitalize">{path.approach}</span>
            </div>
            {selectedPath === path.path_id && (
              <Star size={18} className="text-brand-500 fill-brand-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{path.description}</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-gray-400">Duration</p>
              <p className="font-medium text-gray-900 dark:text-white">{path.estimated_duration}</p>
            </div>
            <div>
              <p className="text-gray-400">Market Demand</p>
              <p className="font-medium text-gray-900 dark:text-white">{path.market_demand}/10</p>
            </div>
            <div>
              <p className="text-gray-400">Success Rate</p>
              <p className="font-medium text-gray-900 dark:text-white">{path.success_probability}%</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Step 5: Roadmap preview ──
function Step5({ roadmap, loading }) {
  if (loading) return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-2xl bg-brand-500 mx-auto mb-3 flex items-center justify-center">
        <Route size={24} className="text-white animate-pulse" />
      </div>
      <p className="font-display font-semibold text-gray-700 dark:text-gray-300">Building your roadmap...</p>
      <p className="text-sm text-gray-400 mt-1">Crafting a step-by-step plan with real resources</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          Your personalized roadmap is ready! {roadmap?.phases?.length} phases, {roadmap?.phases?.reduce((a, p) => a + p.milestones?.length, 0) || 0} milestones.
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {roadmap?.phases?.map((phase) => (
          <div key={phase.phase_number} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {phase.phase_number}
              </span>
              <h4 className="font-display font-semibold text-gray-900 dark:text-white text-sm">{phase.title}</h4>
              <span className="badge badge-brand ml-auto">{phase.duration}</span>
            </div>
            <div className="space-y-2 ml-8">
              {phase.milestones?.slice(0, 3).map((m) => (
                <div key={m.milestone_id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">{m.title}</p>
                </div>
              ))}
              {phase.milestones?.length > 3 && (
                <p className="text-xs text-brand-500 ml-3.5">+{phase.milestones.length - 3} more milestones</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Wizard Component ──
export default function GoalWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [goalData, setGoalData] = useState({ title: "", category: "", description: "", timeframe: "" });
  const [goalId, setGoalId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  const updateGoal = (updates) => setGoalData((p) => ({ ...p, ...updates }));
  const updateAnswer = (i, val) => setAnswers((p) => ({ ...p, [i]: val }));

  const canNext = () => {
    if (step === 1) return goalData.title && goalData.category;
    if (step === 2) return questions.every((_, i) => answers[i]?.trim());
    if (step === 3) return !!analysis;
    if (step === 4) return !!selectedPath;
    return true;
  };

  const handleNext = async () => {
    if (!canNext()) { toast.error("Please complete all fields before continuing."); return; }

    if (step === 1) {
      // Save goal + fetch clarifying questions
      setLoading(true);
      try {
        const res = await api.post("/goals", goalData);
        setGoalId(res.data._id);
        const qRes = await api.post("/ai/clarify", { goal_id: res.data._id });
        setQuestions(qRes.data.questions);
        setStep(2);
      } catch {
        toast.error("Failed to save goal. Please try again.");
      } finally { setLoading(false); }
    }
    else if (step === 2) {
      // Submit answers → get analysis
      setLoading(true);
      try {
        const res = await api.post("/ai/analyze", {
          goal_id: goalId,
          answers: questions.map((q, i) => ({ question: q, answer: answers[i] })),
        });
        setAnalysis(res.data.analysis);
        setStep(3);
      } catch {
        toast.error("Analysis failed. Please try again.");
      } finally { setLoading(false); }
    }
    else if (step === 3) {
      // Generate strategic paths
      setLoading(true);
      try {
        const res = await api.post("/ai/paths", { goal_id: goalId });
        setPaths(res.data.paths);
        setStep(4);
      } catch {
        toast.error("Failed to generate paths.");
      } finally { setLoading(false); }
    }
    else if (step === 4) {
      // Generate roadmap for chosen path
      setLoading(true);
      try {
        const res = await api.post("/ai/roadmap", { goal_id: goalId, path_id: selectedPath });
        setRoadmap(res.data.roadmap);
        setStep(5);
      } catch {
        toast.error("Roadmap generation failed.");
      } finally { setLoading(false); }
    }
    else if (step === 5) {
      // Save everything and navigate to goal
      setSaving(true);
      try {
        await api.post(`/goals/${goalId}/activate`);
        toast.success("🎉 Your goal and roadmap are ready!");
        navigate(`/goals/${goalId}`);
      } catch {
        toast.error("Failed to activate goal.");
      } finally { setSaving(false); }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300
                  ${isActive ? "bg-brand-500 border-brand-500 shadow-glow-brand"
                    : isDone ? "bg-brand-500 border-brand-500 opacity-60"
                    : "bg-surface-100 dark:bg-dark-600 border-surface-200 dark:border-dark-400"
                  }`}>
                  <Icon size={16} className={isActive || isDone ? "text-white" : "text-gray-400"} />
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${isActive ? "text-brand-500 font-medium" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 transition-all duration-500 ${isDone ? "bg-brand-400" : "bg-surface-200 dark:bg-dark-500"}`} style={{ width: 32 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card p-6 mb-6">
        <div className="mb-6">
          <h2 className="section-title">{STEPS[step - 1].label}</h2>
          <p className="section-subtitle">{STEPS[step - 1].desc}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <Step1 data={goalData} onChange={updateGoal} />}
            {step === 2 && <Step2 questions={questions} answers={answers} onAnswer={updateAnswer} loading={loading && step === 2} />}
            {step === 3 && <Step3 analysis={analysis} loading={loading && step === 3} />}
            {step === 4 && <Step4 paths={paths} selectedPath={selectedPath} onSelect={setSelectedPath} loading={loading && step === 4} />}
            {step === 5 && <Step5 roadmap={roadmap} loading={loading && step === 5} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 && setStep((p) => p - 1)}
          disabled={step === 1 || loading}
          className="btn-secondary"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading || saving}
          className="btn-primary"
        >
          {loading || saving ? (
            <><Loader2 size={15} className="animate-spin" /> Processing...</>
          ) : step === 5 ? (
            <>Start Journey <CheckCircle2 size={15} /></>
          ) : (
            <>Continue <ChevronRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  );
}
