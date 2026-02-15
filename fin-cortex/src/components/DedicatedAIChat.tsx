"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabaseClient } from "@/lib/supabase/client";
import { Send, RotateCcw, Bot, User, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useTheme } from "@/hooks/useTheme";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const ROLE_GREETINGS: Record<string, string> = {
    admin:
        "Hello! I'm your FinCortex AI Assistant. As an admin, I can help you with company-wide analytics, budgets, user data, and reimbursement reports. What would you like to know?",
    manager:
        "Hello! I'm your FinCortex AI Assistant. I can help you with your team's reimbursements, pending approvals, budget summaries, and your own claims. How can I assist you?",
    user:
        "Hello! I'm your FinCortex AI Assistant. I can help you check your reimbursements, remaining budget, claim status, and more. What would you like to know?",
    employee:
        "Hello! I'm your FinCortex AI Assistant. I can help you check your reimbursements, remaining budget, claim status, and more. What would you like to know?",
};

const SUGGESTED_QUERIES: Record<string, string[]> = {
    admin: [
        "What is the total reimbursement spend this quarter?",
        "Show me all pending claims across the company",
        "Which department has the highest expenses?",
        "How many policy violations this month?",
    ],
    manager: [
        "Show pending claims for my team",
        "What's my team's total spending this month?",
        "Who has the most reimbursements on my team?",
        "What are my recent reimbursements?",
    ],
    user: [
        "What are my recent reimbursements?",
        "How much budget do I have left this month?",
        "Show my pending claims",
        "What's my total reimbursed amount this year?",
    ],
    employee: [
        "What are my recent reimbursements?",
        "How much budget do I have left this month?",
        "Show my pending claims",
        "What's my total reimbursed amount this year?",
    ],
};

const DedicatedAIChatHeader = ({ role, resetConversation, isDarkTheme }: { role: string; resetConversation: () => void, isDarkTheme: boolean }) => (
    <CardHeader className={cn(
        "border-b flex flex-row items-center justify-between py-5 px-6 backdrop-blur-md",
        isDarkTheme
            ? "border-white/5 bg-slate-950/40"
            : "border-slate-200 bg-white/60"
    )}>
        <div className="flex items-center space-x-4">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
            </div>
            <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        FinCortex Intelligence
                    </span>
                </CardTitle>
                <CardDescription className={cn(
                    "text-xs font-medium flex items-center mt-1",
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                )}>
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400/80" />
                    <span className="uppercase tracking-widest opacity-80">{role} Secure Access</span>
                    <span className={cn("mx-2", isDarkTheme ? "text-slate-600" : "text-slate-300")}>•</span>
                    <span className="text-emerald-500">Active</span>
                </CardDescription>
            </div>
        </div>
        <Button
            variant="outline"
            size="sm"
            onClick={resetConversation}
            className={cn(
                "transition-all duration-300 rounded-lg group",
                isDarkTheme
                    ? "hover:bg-white/5 border-white/10 text-slate-300 hover:text-white"
                    : "hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
            )}
        >
            <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            New Session
        </Button>
    </CardHeader>
);

export function DedicatedAIChat() {
    const { user, userProfile } = useAuth();
    const { isDarkTheme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState("default");
    const [hasInitialized, setHasInitialized] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const role = userProfile?.userRole || "user";

    // Initialize with greeting
    useEffect(() => {
        if (user && !hasInitialized) {
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
    }, [hasInitialized, user, role]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getAuthToken = useCallback(async () => {
        try {
            const {
                data: { session: currentSession },
            } = await supabaseClient.auth.getSession();
            return currentSession?.access_token || "";
        } catch {
            return "";
        }
    }, []);

    const sendMessage = useCallback(
        async (messageText?: string) => {
            const text = (messageText || input).trim();
            if (!text || isLoading || !user) return;

            const userMessage: Message = {
                id: `user-${Date.now()}`,
                role: "user",
                content: text,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
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

                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content:
                        data.response ||
                        "I'm sorry, I couldn't process that request. Please try again.",
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, assistantMessage]);

                if (data.conversation_id) {
                    setConversationId(data.conversation_id);
                }
            } catch (error) {
                console.error("Chat error:", error);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: "assistant",
                        content:
                            "I'm having trouble connecting right now. Please make sure the AI service is running and try again.",
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
                body: JSON.stringify({
                    user_id: user.id,
                    conversation_id: conversationId,
                }),
            });
        } catch {
            // Reset locally
        }

        const greeting = ROLE_GREETINGS[role] || ROLE_GREETINGS.user;
        setMessages([
            {
                id: `greeting-reset-${Date.now()}`,
                role: "assistant",
                content: greeting,
                timestamp: new Date(),
            },
        ]);
        setConversationId(`session-${Date.now()}`);
    }, [user, conversationId, role, getAuthToken]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) return null;

    const suggestions = SUGGESTED_QUERIES[role] || SUGGESTED_QUERIES.user;

    return (
        <Card className={cn(
            "flex flex-col h-[calc(100vh-14rem)] min-h-[600px] backdrop-blur-xl border shadow-2xl rounded-2xl overflow-hidden transition-colors duration-300",
            isDarkTheme
                ? "bg-black/60 border-white/10"
                : "bg-white/80 border-slate-200"
        )}>
            <DedicatedAIChatHeader role={role} resetConversation={resetConversation} isDarkTheme={isDarkTheme} />

            <ScrollArea className="flex-1 p-8">
                <div className="space-y-8 max-w-4xl mx-auto">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg",
                                msg.role === "assistant"
                                    ? "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 ring-1 ring-white/10"
                                    : isDarkTheme ? "bg-slate-800 border border-white/5 ring-1 ring-white/10" : "bg-slate-100 border border-slate-200"
                            )}>
                                {msg.role === "assistant" ? (
                                    <Bot className="w-6 h-6 text-white" />
                                ) : (
                                    <User className={cn("w-6 h-6", isDarkTheme ? "text-slate-300" : "text-slate-600")} />
                                )}
                            </div>

                            <div className={cn(
                                "flex flex-col gap-2 max-w-[75%]",
                                msg.role === "user" ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-xl border transition-all duration-300",
                                    msg.role === "assistant"
                                        ? isDarkTheme
                                            ? "bg-zinc-900/80 border-white/5 text-slate-100 backdrop-blur-sm"
                                            : "bg-white border-slate-200 text-slate-800"
                                        : isDarkTheme
                                            ? "bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-blue-50 backdrop-blur-sm"
                                            : "bg-blue-50 border-blue-100 text-blue-900"
                                )}>
                                    {msg.content}
                                </div>
                                <div className="flex items-center space-x-2 px-1">
                                    <span className={cn(
                                        "text-[10px] font-medium uppercase tracking-tighter",
                                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        {msg.role === "assistant" ? "FinCortex AI" : "You"}
                                    </span>
                                    <span className={cn("text-[10px]", isDarkTheme ? "text-slate-700" : "text-slate-300")}>•</span>
                                    <span className={cn(
                                        "text-[10px]",
                                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-4 animate-in fade-in duration-300">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ring-1 ring-white/10">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className={cn(
                                "px-5 py-4 rounded-2xl backdrop-blur-sm flex items-center space-x-1.5 shadow-xl border transition-colors duration-300",
                                isDarkTheme ? "bg-slate-800/80 border-white/5" : "bg-white border-slate-200"
                            )}>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <CardFooter className={cn(
                "flex flex-col p-6 border-t backdrop-blur-2xl transition-colors duration-300",
                isDarkTheme ? "bg-slate-950/60 border-white/5" : "bg-slate-50/80 border-slate-200"
            )}>
                {messages.length <= 1 && (
                    <div className="w-full max-w-4xl mx-auto mb-6 flex flex-wrap gap-2.5 justify-center animate-in fade-in slide-in-from-top-2 duration-700">
                        {suggestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q)}
                                className={cn(
                                    "px-4 py-2 rounded-xl border text-xs font-medium transition-all duration-300 shadow-sm",
                                    isDarkTheme
                                        ? "bg-white/5 border-white/10 text-slate-400 hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-400"
                                        : "bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                                )}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div className="w-full max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
                    <div className={cn(
                        "relative flex items-center border rounded-2xl transition-all duration-300 overflow-hidden shadow-2xl",
                        isDarkTheme
                            ? "bg-zinc-950 border-white/10 group-focus-within:border-white/20"
                            : "bg-white border-slate-200 group-focus-within:border-blue-200"
                    )}>
                        <textarea
                            ref={inputRef}
                            placeholder="Query your reimbursement intelligence..."
                            className={cn(
                                "w-full pr-16 pl-5 py-4 bg-transparent text-sm focus:outline-none resize-none h-14 transition-all duration-200",
                                isDarkTheme ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                            )}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 rounded-xl transition-all duration-300 active:scale-95"
                        >
                            <Send className="w-4.5 h-4.5" />
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-center space-x-4 opacity-50">
                    <div className={cn("h-px w-12 bg-gradient-to-r from-transparent", isDarkTheme ? "to-slate-700" : "to-slate-300")} />
                    <div className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] flex items-center",
                        isDarkTheme ? "text-slate-500" : "text-slate-400"
                    )}>
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-blue-400 animate-pulse" />
                        FinCortex AI Powered
                    </div>
                    <div className={cn("h-px w-12 bg-gradient-to-l from-transparent", isDarkTheme ? "to-slate-700" : "to-slate-300")} />
                </div>
            </CardFooter>
        </Card>
    );
}
