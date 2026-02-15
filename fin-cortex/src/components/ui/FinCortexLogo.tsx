"use client";

import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface FinCortexLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
}

export function FinCortexLogo({ className, size = "md", showText = true }: FinCortexLogoProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    };

    const iconClasses = {
        sm: "w-5 h-5",
        md: "w-8 h-8",
        lg: "w-10 h-10",
        xl: "w-14 h-14"
    };

    const textClasses = {
        sm: "text-[10px]",
        md: "text-base",
        lg: "text-xl",
        xl: "text-3xl"
    };

    const subtextClasses = {
        sm: "text-[6px]",
        md: "text-[8px]",
        lg: "text-[10px]",
        xl: "text-[14px]"
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn(
                "bg-[var(--card-dark)] backdrop-blur-md border border-[var(--border-subtle)] rounded-xl flex items-center justify-center shadow-2xl",
                sizeClasses[size]
            )}>
                <Shield className={cn("text-[var(--text-primary)]", iconClasses[size])} />
            </div>
            {showText && (
                <div className="flex flex-col">
                    <span className={cn("font-black text-[var(--text-primary)] uppercase tracking-widest leading-none", textClasses[size])}>
                        FinCortex
                    </span>
                    <span className={cn("font-bold text-[var(--text-secondary)] uppercase tracking-[0.4em] mt-1", subtextClasses[size])}>
                        Intelligence Layer
                    </span>
                </div>
            )}
        </div>
    );
}
