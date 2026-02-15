"use client";

import { DedicatedAIChat } from "@/components/DedicatedAIChat";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { UserNavbar } from "@/components/dashboard/UserNavbar";
import { useTheme } from "@/hooks/useTheme";

export default function UserAssistantPage() {
    const { toggleTheme, themeIcon } = useTheme();

    return (
        <RouteProtection allowedRoles={['user']}>
            <div className="flex min-h-screen w-full bg-[var(--background-dark)]">
                <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />

                <main className="flex-1 flex flex-col pt-24 px-6 md:px-10 pb-10">
                    <div className="max-w-6xl mx-auto w-full space-y-6">
                        <div className="flex flex-col space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">AI Assistant</h1>
                            <p className="text-[var(--text-secondary)]">
                                Get instant answers about your reimbursements, budget, and company policies.
                            </p>
                        </div>

                        <DedicatedAIChat />
                    </div>
                </main>
            </div>
        </RouteProtection>
    );
}
