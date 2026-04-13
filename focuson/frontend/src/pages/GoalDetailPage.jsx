/**
 * GoalDetailPage.jsx — Full goal view with roadmap
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function GoalDetailPage() {
  const { id } = useParams();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/goals/${id}`).then(r => setGoal(r.data)).catch(() => {
      // Mock goal
      setGoal({
        _id: id, title: "Become a Production AI Engineer", category: "career", status: "active",
        description: "Master LLMs, RAG pipelines, and agentic AI to land a senior role.",
        progress: 35,
        roadmap: {
          overall_progress: 35,
          phases: [
            { phase_number: 1, title: "Foundation", duration: "4 weeks", milestones: [
              { milestone_id: "m1", title: "Complete Python for Data Science", type: "learning", status: "completed", resources: [{ title: "Python for Everybody", url: "https://coursera.org", platform: "Coursera", is_free: false }] },
              { milestone_id: "m2", title: "Understand Transformer Architecture", type: "learning", status: "in_progress", resources: [{ title: "Attention Is All You Need paper", url: "https://arxiv.org/abs/1706.03762", platform: "arXiv", is_free: true }] },
              { milestone_id: "m3", title: "Build first LLM wrapper app", type: "project", status: "pending", resources: [] },
            ]},
            { phase_number: 2, title: "RAG & Vector DBs", duration: "6 weeks", milestones: [
              { milestone_id: "m4", title: "RAG Fundamentals on DeepLearning.AI", type: "learning", status: "pending", resources: [{ title: "Building RAG with LangChain", url: "https://deeplearning.ai", platform: "DeepLearning.AI", is_free: true }] },
            ]},
          ]
        }
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleMilestone = async (roadmapId, milestoneId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.put(`/roadmaps/${roadmapId}/milestones/${milestoneId}`, { status: newStatus });
      setGoal(prev => ({
        ...prev,
        roadmap: {
          ...prev.roadmap,
          phases: prev.roadmap.phases.map(p => ({
            ...p,
            milestones: p.milestones.map(m =>
              m.milestone_id === milestoneId ? { ...m, status: newStatus } : m
            )
          }))
        }
      }));
      toast.success(newStatus === "completed" ? "Milestone completed! 🎉" : "Marked as pending");
    } catch { toast.error("Failed to update milestone"); }
  };

  const statusIcon = (status) => {
    if (status === "completed")  return <CheckCircle2 size={18} className="text-green-500" />;
    if (status === "in_progress") return <Clock size={18} className="text-amber-500 animate-pulse" />;
    return <Circle size={18} className="text-gray-300 dark:text-gray-600" />;
  };

  if (loading) return <div className="max-w-4xl mx-auto p-8 space-y-4">{[1,2,3].map(i=><div key={i} className="skeleton h-32 rounded-2xl"/>)}</div>;
  if (!goal) return <div className="text-center py-20 text-gray-400">Goal not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/goals" className="btn-ghost mb-4 inline-flex"><ArrowLeft size={15}/> Back to Goals</Link>
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2"><span className="badge badge-brand capitalize">{goal.category}</span><span className="badge badge-success capitalize">{goal.status}</span></div>
          <Link to="/mentor" className="btn-secondary text-xs"><MessageCircle size={13}/>Ask Mentor</Link>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">{goal.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{goal.description}</p>
        <div className="progress-bar h-3"><div className="progress-fill" style={{width:`${goal.progress||0}%`}}/></div>
        <p className="text-sm text-brand-500 font-semibold mt-2">{goal.progress||0}% Overall Progress</p>
      </div>

      <h2 className="section-title text-xl mb-4">Your Roadmap</h2>
      <div className="space-y-4">
        {goal.roadmap?.phases?.map(phase => (
          <motion.div key={phase.phase_number} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center">{phase.phase_number}</span>
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">{phase.title}</h3>
              <span className="badge badge-brand ml-auto">{phase.duration}</span>
            </div>
            <div className="space-y-3 ml-10">
              {phase.milestones?.map(m => (
                <div key={m.milestone_id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-600 transition-colors">
                  <button onClick={() => toggleMilestone(goal.roadmap?._id, m.milestone_id, m.status)} className="mt-0.5 flex-shrink-0">
                    {statusIcon(m.status)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.status==='completed'?'line-through text-gray-400':'text-gray-900 dark:text-white'}`}>{m.title}</p>
                    <span className="badge badge-brand text-[10px] mt-1 capitalize">{m.type}</span>
                    {m.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.resources.map((r, ri) => (
                          <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:underline">
                            <ExternalLink size={10}/>{r.title} {r.is_free && <span className="badge badge-success text-[10px]">Free</span>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
