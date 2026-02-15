"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!userProfile) {
                router.replace("/login");
                return;
            }

            const role = userProfile.userRole;
            if (role === "admin") {
                router.replace("/admin");
            } else if (role === "manager") {
                router.replace("/manager");
            } else {
                router.replace("/user/dashboard");
            }
        }
    }, [userProfile, loading, router]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Synchronizing console access...
            </p>
        </div>
    );
}
