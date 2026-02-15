"use client";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function FloatingPills() {
    const { isDarkTheme } = useTheme();

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Top Left Pill */}
            <div className={cn(
                "absolute top-[20%] -left-[5%] w-96 h-24 blur-2xl rounded-full rotate-[15deg] transform translate-x-0 transition-all duration-1000",
                isDarkTheme ? "bg-gradient-to-r from-white/5 to-transparent" : "bg-gradient-to-r from-blue-500/5 to-transparent shadow-xl"
            )} />

            {/* Center Left Pill (Blue-ish) */}
            <div className={cn(
                "absolute top-[45%] left-[10%] w-64 h-16 blur-3xl rounded-full -rotate-[25deg] transition-all duration-1000",
                isDarkTheme ? "bg-blue-500/10" : "bg-blue-500/5"
            )} />

            {/* Center Top Small Pill */}
            <div className={cn(
                "absolute top-[10%] left-[30%] w-32 h-8 blur-xl rounded-full rotate-[30deg] transition-all duration-1000",
                isDarkTheme ? "bg-white/5" : "bg-slate-500/5"
            )} />

            {/* Top Right Pill */}
            <div className={cn(
                "absolute top-[15%] right-[20%] w-48 h-12 blur-xl rounded-full rotate-[20deg] transition-all duration-1000",
                isDarkTheme ? "bg-white/[0.02]" : "bg-slate-500/5"
            )} />

            {/* Bottom Right Pill */}
            <div className={cn(
                "absolute bottom-[20%] right-[10%] w-80 h-20 blur-3xl rounded-full rotate-[-15deg] transition-all duration-1000",
                isDarkTheme ? "bg-gradient-to-l from-white/5 to-transparent" : "bg-gradient-to-l from-indigo-500/5 to-transparent shadow-xl"
            )} />

            {/* Background Decorative Glows */}
            <div className={cn(
                "absolute top-[-20%] left-[-10%] w-[800px] h-[800px] blur-[150px] rounded-full transition-all duration-1000",
                isDarkTheme ? "bg-purple-600/[0.03]" : "bg-purple-500/[0.02]"
            )} />
            <div className={cn(
                "absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] blur-[150px] rounded-full transition-all duration-1000",
                isDarkTheme ? "bg-blue-600/[0.03]" : "bg-blue-500/[0.02]"
            )} />
        </div>
    );
}
