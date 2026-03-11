import React, { useState, useEffect, useRef } from "react";
import { 
  Home,
  Play,
  MessageSquare,
  Volume2,
  Eye,
  Mic,
  Languages,
  Users,
  Video,
  FileText,
  Settings,
  Plus,
  ArrowUp,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Sparkles,
  Zap,
  ExternalLink,
  PenTool,
  BookOpen,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateStreamingResponse } from "./services/geminiService";
import { Role, Message, Chat, PersonalityMode, AppSettings } from "./types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [settings, setSettings] = useState<AppSettings>({
    personality: PersonalityMode.GENERAL,
    language: "en",
    darkMode: false,
    voiceEnabled: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    document.documentElement.className = settings.darkMode ? "dark" : "light";
  }, [settings.darkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const createNewChat = async () => {
    const id = crypto.randomUUID();
    const title = "New Conversation";
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      fetchChats();
      setCurrentChatId(id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = crypto.randomUUID();
      const title = input.slice(0, 30) + (input.length > 30 ? "..." : "");
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, title }),
      });
      setCurrentChatId(chatId);
      fetchChats();
    }

    const userMessage: Message = { role: Role.USER, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      const responseStream = await generateStreamingResponse(
        [...messages, userMessage],
        settings.personality,
        settings.language
      );

      let assistantContent = "";
      const assistantMessage: Message = { role: Role.ASSISTANT, content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      for await (const chunk of responseStream) {
        const text = chunk.text;
        assistantContent += text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            ...assistantMessage, 
            content: assistantContent 
          };
          return newMessages;
        });
      }

      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: Role.ASSISTANT, content: assistantContent }),
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarItems = [
    { id: "home", label: "Home", icon: Home, section: "main" },
    { id: "chat", label: "Chat", icon: MessageSquare, section: "playground", badge: "New" },
    { id: "tts", label: "Text to Speech", icon: Volume2, section: "playground" },
    { id: "vision", label: "Vision", icon: Eye, section: "playground" },
    { id: "stt", label: "Speech to Text", icon: Mic, section: "playground" },
    { id: "translate", label: "Translate", icon: Languages, section: "playground" },
    { id: "agents", label: "Conversational Agents", icon: Users, section: "products" },
    { id: "dubbing", label: "Video Dubbing", icon: Video, section: "products" },
    { id: "docs", label: "Documentation", icon: FileText, section: "bottom" },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[var(--bg-light)]">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="w-[260px] bg-[var(--bg-sidebar)] flex flex-col z-20"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white dark:text-black font-bold text-xl">s</span>
                </div>
                <span className="text-xl font-bold tracking-tight">sarvam</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
              <div>
                <button 
                  onClick={() => setActiveTab("home")}
                  className={cn("sidebar-item w-full", activeTab === "home" && "active")}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] px-3 mb-2 block opacity-60">Playground</label>
                <div className="space-y-0.5">
                  {sidebarItems.filter(i => i.section === "playground").map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn("sidebar-item w-full justify-between", activeTab === item.id && "active")}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] px-3 mb-2 block opacity-60">Products</label>
                <div className="space-y-0.5">
                  {sidebarItems.filter(i => i.section === "products").map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn("sidebar-item w-full", activeTab === item.id && "active")}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setActiveTab("docs")}
                  className={cn("sidebar-item w-full", activeTab === "docs" && "active")}
                >
                  <FileText className="w-5 h-5" />
                  <span>Documentation</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 px-3 py-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  A
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">Adarsh</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Free Plan</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-light)]">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Chat Completions</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">Experiment with models and test prompts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 text-sm font-semibold transition-all shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
              Try Indus
            </button>
            <button 
              onClick={createNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-[var(--border-color)] rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
              <h1 className="text-4xl font-medium text-center font-serif">How can I help you today?</h1>
              
              <div className="w-full max-w-3xl space-y-6">
                <div className="input-container relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-lg min-h-[60px] placeholder:text-gray-400"
                    rows={1}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 transition-all disabled:opacity-50"
                    >
                      <ArrowUp className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { icon: FileText, label: "Summarize a topic" },
                    { icon: Languages, label: "Translate text" },
                    { icon: PenTool, label: "Draft an email" },
                    { icon: BookOpen, label: "Explain a concept" }
                  ].map((action, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(action.label)}
                      className="action-btn"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 md:p-12 space-y-10 max-w-4xl mx-auto w-full">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-6", msg.role === Role.USER ? "justify-end" : "justify-start")}>
                  {msg.role === Role.ASSISTANT && (
                    <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white dark:text-black font-bold text-xs">s</span>
                    </div>
                  )}
                  <div className={cn("max-w-[85%] p-5 rounded-3xl text-[15px] leading-relaxed transition-all", 
                    msg.role === Role.USER ? "bg-black/[0.03] dark:bg-white/[0.03] text-[var(--text-primary)]" : "bg-transparent")}>
                    <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:rounded-xl prose-pre:border-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input (when messages exist) */}
        <div className="p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="input-container shadow-sm">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={messages.length === 0 ? "What's on your mind?" : "Ask a follow up..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-1 text-[15px] min-h-[24px] max-h-[200px] placeholder:text-gray-400"
                  rows={1}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30",
                    input.trim() ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)]"
                  )}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-[var(--text-secondary)] mt-4 opacity-40">
              Sarvam AI can make mistakes. Check important info.
            </p>
          </div>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl overflow-hidden z-10 border shadow-2xl"
              >
                <div className="p-5 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold">Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dark Mode</span>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                      className={cn("w-12 h-6 rounded-full relative transition-all", settings.darkMode ? "bg-black" : "bg-gray-200")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", settings.darkMode ? "left-7" : "left-1")} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Personality</label>
                    <select 
                      value={settings.personality}
                      onChange={(e) => setSettings(s => ({ ...s, personality: e.target.value as PersonalityMode }))}
                      className="w-full p-2 border rounded-lg bg-transparent"
                    >
                      {Object.values(PersonalityMode).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <div className="flex gap-2">
                      {["en", "gu"].map(l => (
                        <button 
                          key={l}
                          onClick={() => setSettings(s => ({ ...s, language: l as "en" | "gu" }))}
                          className={cn("flex-1 py-2 border rounded-lg", settings.language === l ? "bg-black text-white" : "hover:bg-black/5")}
                        >
                          {l === "en" ? "English" : "Gujarati"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
