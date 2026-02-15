"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabaseClient } from "@/lib/supabase/client";
import {
    Bot,
    Send,
    X,
    RotateCcw,
    Sparkles,
    ShieldCheck,
    User,
    MessageSquare,
    ChevronDown,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const ROLE_GREETINGS: Record<string, string> = {
    admin:
        "Hello! I'm your FinCortex AI Assistant. As an admin, I can help you with company-wide analytics, budgets, and reports. What would you like to know?",
    manager:
        "Hello! I'm your FinCortex AI Assistant. I can help you with your team's reimbursements and pending approvals. How can I assist you?",
    user:
        "Hello! I'm your FinCortex AI Assistant. I can help you check your reimbursements, remaining budget, and claim status. What's on your mind?",
    employee:
        "Hello! I'm your FinCortex AI Assistant. I can help you check your reimbursements, remaining budget, and claim status. What's on your mind?",
};

const SUGGESTED_QUERIES: Record<string, string[]> = {
    admin: ["Quarterly spend summary", "Show pending claims", "Department expenses", "Policy violations"],
    manager: ["Team pending claims", "Team spending this month", "My recent claims", "Budget summary"],
    user: ["My recent reimbursements", "Remaining budget", "Show pending claims", "Total reimbursed this year"],
};

export function AIChatAssistant() {
    const { user, userProfile } = useAuth();
    const { isDarkTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState("default");
    const [hasInitialized, setHasInitialized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const role = userProfile?.userRole || "user";
    const assistantPath = `/${role === 'user' ? 'user' : role}/assistant`;

    useEffect(() => {
        if (isOpen && !hasInitialized && user) {
            const greeting = ROLE_GREETINGS[role] || ROLE_GREETINGS.user;
            setMessages([
                {
                    id: "greeting",
                    role: "assistant",
                    content: greeting,
                    timestamp: new Date(),
                },
            ]);
            setHasInitialized(true);
        }
    }, [isOpen, hasInitialized, user, role]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getAuthToken = useCallback(async () => {
        try {
            const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
            return currentSession?.access_token || "";
        } catch {
            return "";
        }
    }, []);

    const sendMessage = useCallback(
        async (messageText?: string) => {
            const text = (messageText || input).trim();
            if (!text || isLoading || !user) return;

            setMessages((prev) => [
                ...prev,
                { id: `user-${Date.now()}`, role: "user", content: text, timestamp: new Date() },
            ]);
            setInput("");
            setIsLoading(true);

            try {
                const token = await getAuthToken();
                const response = await fetch("/api/v1/assistant/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        message: text,
                        conversation_id: conversationId,
                    }),
                });

                const data = await response.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `assistant-${Date.now()}`,
                        role: "assistant",
                        content: data.response || "I'm sorry, I couldn't process that request.",
                        timestamp: new Date(),
                    },
                ]);

                if (data.conversation_id) setConversationId(data.conversation_id);
            } catch (error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: "assistant",
                        content: "I'm having trouble connecting right now. Please try again later.",
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, user, conversationId, getAuthToken]
    );

    const resetConversation = useCallback(async () => {
        if (!user) return;
        try {
            const token = await getAuthToken();
            await fetch("/api/v1/assistant/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ user_id: user.id, conversation_id: conversationId }),
            });
        } catch { }

        setMessages([{
            id: "greeting-reset",
            role: "assistant",
            content: ROLE_GREETINGS[role] || ROLE_GREETINGS.user,
            timestamp: new Date(),
        }]);
        setConversationId(`session-${Date.now()}`);
    }, [user, conversationId, role, getAuthToken]);

    if (!user) return null;

    return (
        <>
            {/* FAB */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
                    <Bot className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div className={cn(
                    "fixed bottom-6 right-6 z-50 w-[400px] h-[600px] backdrop-blur-2xl border shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-500 transition-colors duration-300",
                    isDarkTheme ? "bg-black/60 border-white/10" : "bg-white/90 border-slate-200"
                )}>
                    {/* Header */}
                    <div className={cn(
                        "border-b p-4 flex items-center justify-between transition-colors duration-300",
                        isDarkTheme ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-100"
                    )}>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className={cn("text-sm font-bold", isDarkTheme ? "text-slate-100" : "text-slate-800")}>FinCortex AI</h3>
                                <div className="flex items-center space-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className={cn(
                                        "text-[10px] font-medium uppercase tracking-wider",
                                        isDarkTheme ? "text-slate-400" : "text-slate-500"
                                    )}>Secured Access</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Link
                                href={assistantPath}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isDarkTheme ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                )}
                                title="Open in Full Screen"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={resetConversation}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isDarkTheme ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                )}
                                title="Reset Conversation"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isDarkTheme ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                )}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-lg border transition-all duration-300",
                                    msg.role === "assistant"
                                        ? isDarkTheme
                                            ? "bg-zinc-900/80 border-white/5 text-slate-100"
                                            : "bg-white border-slate-100 text-slate-800"
                                        : isDarkTheme
                                            ? "bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-blue-50"
                                            : "bg-blue-50 border-blue-100 text-blue-900"
                                )}>
                                    {msg.content}
                                </div>
                                <span className={cn(
                                    "text-[9px] mt-1 px-1",
                                    isDarkTheme ? "text-slate-500" : "text-slate-400"
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start">
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl shadow-lg flex space-x-1 border transition-colors duration-300",
                                    isDarkTheme ? "bg-slate-800/80 border-white/5" : "bg-white border-slate-100"
                                )}>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input */}
                    <div className={cn(
                        "p-4 border-t transition-colors duration-300",
                        isDarkTheme ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-100 shadow-inner"
                    )}>
                        {messages.length <= 1 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {(SUGGESTED_QUERIES[role] || SUGGESTED_QUERIES.user).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className={cn(
                                            "text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                                            isDarkTheme
                                                ? "bg-white/5 border-white/5 text-slate-400 hover:bg-blue-600/10 hover:border-blue-500/20 hover:text-blue-400"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                                        )}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className={cn(
                            "relative flex items-center border rounded-xl transition-all overflow-hidden shadow-inner",
                            isDarkTheme
                                ? "bg-zinc-950 border-white/10 focus-within:border-blue-500/50"
                                : "bg-white border-slate-200 focus-within:border-blue-400"
                        )}>
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Ask me anything..."
                                className={cn(
                                    "w-full bg-transparent p-3 text-xs focus:outline-none resize-none h-11",
                                    isDarkTheme ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                                )}
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={isLoading || !input.trim()}
                                className="mr-2 p-1.5 bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Send className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                        <div className={cn(
                            "mt-3 flex items-center justify-center space-x-2 text-[9px] uppercase tracking-widest font-bold opacity-60",
                            isDarkTheme ? "text-slate-500" : "text-slate-400"
                        )}>
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            <span>FinCortex Intelligence</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
