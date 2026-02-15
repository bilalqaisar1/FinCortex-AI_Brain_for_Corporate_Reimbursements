"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { FinCortexLogo } from "@/components/ui/FinCortexLogo";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const { toggleTheme, themeIcon } = useTheme();
  const { user } = useAuth();

  const navContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  const navItems = [
    { label: "HOME", href: "#home" },
    { label: "JOURNEY", href: "#features" },
    { label: "PORTFOLIO", href: "#works" },
    { label: "SERVICES", href: "#solutions" },
    { label: "ABOUT", href: "#about" },
    { label: "CONTACT", href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Intersection Observer for active section tracking
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Adjust trigger point
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ['home', 'features', 'works', 'solutions', 'about', 'reviews', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const getPillStyles = () => {
    let targetId = hoveredSection || activeSection;
    if (!targetId) return { opacity: 0, visibility: "hidden" as const };

    // Map 'reviews' to 'about' since reviews section falls under the ABOUT nav item
    if (targetId === 'reviews') targetId = 'about';
    const targetRef = itemRefs.current[targetId];
    const containerRef = navContainerRef.current;

    if (targetRef && containerRef) {
      const targetRect = targetRef.getBoundingClientRect();
      const containerRect = containerRef.getBoundingClientRect();

      return {
        left: `${targetRect.left - containerRect.left}px`,
        width: `${targetRect.width}px`,
        opacity: 1,
        visibility: "visible" as const,
      };
    }
    return { opacity: 0, visibility: "hidden" as const };
  };

  return (
    <nav className={cn(
      "fixed top-0 right-0 left-0 z-40 transition-all duration-500 px-6 py-4",
      isScrolled
        ? "bg-[var(--background-dark)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-lg py-3"
        : "bg-transparent py-6"
    )}>
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center group transition-transform hover:scale-105">
          <FinCortexLogo size="lg" showText />
        </Link>

        {/* Center: Nav Links */}
        <div
          ref={navContainerRef}
          className="hidden lg:flex items-center gap-1 bg-[var(--card-dark)] backdrop-blur-md border border-[var(--border-subtle)] rounded-full px-2 py-1 relative"
          onMouseLeave={() => setHoveredSection(null)}
        >
          {/* Active Pill 배경 */}
          <div
            className="absolute h-[80%] bg-[var(--text-primary)] rounded-full transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(165,180,252,0.3)] z-0 top-1/2 -translate-y-1/2"
            style={getPillStyles()}
          />
          {navItems.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = sectionId === activeSection || (sectionId === 'about' && activeSection === 'reviews');
            const isHovered = sectionId === hoveredSection;

            return (
              <Link
                key={item.label}
                href={item.href}
                ref={(el) => { itemRefs.current[sectionId] = el; }}
                onMouseEnter={() => setHoveredSection(sectionId)}
                className={cn(
                  "px-6 py-2 text-[10px] font-black transition-all uppercase tracking-[0.2em] rounded-full relative z-10",
                  (isActive && !hoveredSection) || isHovered ? "text-[var(--background-dark)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[var(--card-dark)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {themeIcon}
          </button>

          <Link href={user ? "/dashboard" : "/login"}>
            <button className="group relative px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300">
              <span className="relative z-10">{user ? "Dashboard" : "Sign In"}</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}