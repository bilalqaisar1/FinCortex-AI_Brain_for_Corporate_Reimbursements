"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RouteProtection } from "@/components/auth/RouteProtection";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteProtection allowedRoles={['admin']}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </RouteProtection>
    );
}
