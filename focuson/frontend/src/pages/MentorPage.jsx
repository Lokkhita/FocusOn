/**
 * MentorPage.jsx
 * Real-time AI mentor chat powered by Claude API (via backend).
 * Features:
 * - Streaming-ready message display
 * - Markdown rendering for AI responses
 * - Context-aware (links to active goals)
 * - Message history per session
 * - Typing indicator
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, RefreshCw, Bot, User, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

// Suggested starter prompts
const SUGGESTIONS = [
  "What should I focus on this week?",
  "I'm feeling stuck on my goal. What should I do?",
  "Review my progress and give me honest feedback",
  "What skills are most in demand for my goal?",
  "Help me break my current milestone into smaller tasks",
];

function ChatMessage({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow-brand">
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className={isAI ? "chat-bubble-ai max-w-[80%]" : "chat-bubble-user max-w-[80%]"}>
        {isAI ? (
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none
                       prose-p:my-1 prose-li:my-0.5 prose-headings:font-display"
          >
            {msg.content}
          </ReactMarkdown>
        ) : (
          <p className="leading-relaxed">{msg.content}</p>
        )}
        <p className={`text-[10px] mt-2 ${isAI ? "text-gray-400" : "text-white/60"}`}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {!isAI && (
        <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-dark-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={14} className="text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="chat-bubble-ai">
        <div className="flex gap-1.5 items-center py-1">
          {[0, 0.2, 0.4].map((delay, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MentorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your AI mentor on FocusOn.\n\nI know your goals, your current roadmap, and your progress. I'm here to help you stay focused, overcome obstacles, and move forward.\n\n**What's on your mind today?**`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (content = input.trim()) => {
    if (!content || isTyping) return;
    setInput("");

    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await api.post("/ai/mentor/chat", {
        message: content,
        session_id: sessionId,
        // Backend will pull user's goals/progress context automatically
      });

      const { reply, session_id: sid } = res.data;
      if (sid) setSessionId(sid);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      toast.error("Failed to get a response. Please try again.");
      // Remove the user message if AI failed
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setInput(content); // Restore input
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearSession = () => {
    setMessages([{
      role: "assistant",
      content: "Session cleared. Let's start fresh — what's on your mind?",
      timestamp: new Date().toISOString(),
    }]);
    setSessionId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-64px)] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow-brand">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">AI Mentor</h1>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Online & Context-Aware
            </p>
          </div>
        </div>
        <button onClick={clearSession} className="btn-ghost gap-1.5 text-xs" title="New session">
          <RefreshCw size={13} /> New Session
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto card p-4 sm:p-6 space-y-4 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
        </AnimatePresence>
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips (shown only when few messages) */}
      {messages.length <= 2 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-surface-100 dark:bg-dark-600
                         text-gray-600 dark:text-gray-300 border border-surface-200 dark:border-dark-400
                         hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400
                         transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="card p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your mentor anything... (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 dark:text-gray-100
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     min-h-[36px] max-h-[120px] py-1.5 font-body leading-relaxed"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
          className="btn-primary p-2.5 flex-shrink-0"
          aria-label="Send message"
        >
          {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
        AI mentor has context of your goals and progress. Responses are for guidance only.
      </p>
    </div>
  );
}
