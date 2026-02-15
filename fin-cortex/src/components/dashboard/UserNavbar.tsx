"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/NotificationCenter";

interface UserNavbarProps {
    isDarkTheme?: boolean;
    toggleTheme: () => void;
    themeIcon: React.ReactNode;
}

export function UserNavbar({ toggleTheme, themeIcon }: UserNavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle mobile menu toggle
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            const mobileToggle = document.getElementById('mobileToggle');
            const navLinks = document.getElementById('navLinks');

            if (mobileToggle && navLinks && !mobileToggle.contains(target) && !navLinks.contains(target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Dashboard", href: "/user/dashboard" },
        { label: "Submit Claims", href: "/user/claims/new" },
        { label: "Claim History", href: "/user/claims/history" },
        { label: "AI Assistant", href: "/user/assistant" },
        { label: "Profile", href: "/user/profile" },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[var(--background-dark)]/60 backdrop-blur-xl border-b border-[var(--border-subtle)] py-3' : 'bg-transparent py-5'}`} id="navbar">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Left side - Logo */}
                <Link href="/user/dashboard" className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                    FINCORTEX
                </Link>

                {/* Center - Menu items */}
                <ul className={cn(
                    "flex items-center gap-8 transition-all duration-500 md:flex hidden",
                    isMobileMenuOpen ? "flex-col absolute top-full left-0 w-full bg-[var(--background-dark)]/95 p-8" : ""
                )} id="navLinks">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:text-purple-500",
                                    pathname === item.href ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                )}
                            >
                                {item.label}
                                {pathname === item.href && (
                                    <div className="h-0.5 w-full bg-gradient-to-r from-[#6366f1] to-[#ec4899] mt-0.5 rounded-full" />
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right side - Theme toggle and Notification */}
                <div className="flex items-center gap-6">
                    <button
                        className="p-2.5 rounded-full bg-[var(--card-dark)] border border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-all duration-300 group"
                        onClick={toggleTheme}
                    >
                        <div className="group-hover:rotate-12 transition-transform">{themeIcon}</div>
                    </button>
                    <div className="hidden sm:block">
                        <NotificationCenter />
                    </div>
                    <button
                        className={`md:hidden flex flex-col gap-1.5 p-2 ${isMobileMenuOpen ? 'active' : ''}`}
                        id="mobileToggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="w-6 h-0.5 bg-[var(--text-primary)]"></span>
                        <span className="w-6 h-0.5 bg-[var(--text-primary)]"></span>
                        <span className="w-6 h-0.5 bg-[var(--text-primary)]"></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
