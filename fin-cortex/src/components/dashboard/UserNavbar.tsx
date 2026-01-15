"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
        { label: "Profile", href: "/user/profile" },
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
            <div className="nav-container" style={{ justifyContent: 'space-between' }}>
                {/* Left side - Logo */}
                <Link href="/user/dashboard" className="logo">
                    Fincortex
                </Link>

                {/* Center - Menu items */}
                <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks" style={{ margin: '0 auto', gap: '2.5rem' }}>
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={handleLinkClick}
                                className={pathname === item.href ? "active" : ""}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right side - Theme toggle and Mobile toggle */}
                <div className="flex items-center gap-4">
                    <button className="theme-toggle" onClick={toggleTheme}>
                        <div className="theme-icon">{themeIcon}</div>
                    </button>
                    <div className="hidden sm:block">
                        <NotificationCenter />
                    </div>
                    <button
                        className={`mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                        id="mobileToggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
