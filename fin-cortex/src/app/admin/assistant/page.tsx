"use client";

import { DedicatedAIChat } from "@/components/DedicatedAIChat";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Bot, Sparkles } from "lucide-react";

export default function AdminAssistantPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Intelligence Hub"
                description="Company-wide insights, policy analysis, and financial forecasting driven by AI."
                icon={Bot}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <DedicatedAIChat />
                </div>

                <div className="space-y-6">
                    <div className="bg-[var(--card-dark)] border border-[var(--border-subtle)] p-6 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-2 mb-4">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <h3 className="font-semibold text-[var(--text-primary)]">Admin Insights</h3>
                        </div>
                        <ul className="space-y-4 text-xs text-[var(--text-muted)]">
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 mr-2 flex-shrink-0" />
                                Query across all departments and teams.
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 mr-2 flex-shrink-0" />
                                Analyze spending trends and policy violations.
                            </li>
                            <li className="flex items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 mr-2 flex-shrink-0" />
                                Generate summary reports for stakeholders.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-[var(--card-dark)] border border-[var(--border-subtle)] p-6 rounded-xl backdrop-blur-sm">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">Pro Tip</h3>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            Ask for "High-risk claims this month" to see a summary of potential policy violations flagged by our AI.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
