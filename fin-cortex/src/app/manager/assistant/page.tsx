"use client";

import { DedicatedAIChat } from "@/components/DedicatedAIChat";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Bot } from "lucide-react";

export default function ManagerAssistantPage() {
    return (
        <RouteProtection allowedRoles={['manager']}>
            <ManagerLayout>
                <div className="space-y-6">
                    <PageHeader
                        title="AI Assistant"
                        description="Manage your team and reimbursements with AI-powered insights."
                        icon={Bot}
                    />

                    <DedicatedAIChat />
                </div>
            </ManagerLayout>
        </RouteProtection>
    );
}
