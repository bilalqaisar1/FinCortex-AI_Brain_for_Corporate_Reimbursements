"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme, themeIcon } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const userRole = userProfile?.userRole || (userProfile?.employee_code !== undefined ? 'user' : null);

  const getRoleBadge = () => {
    if (!userRole) return null;
    const roleColors = {
      admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      user: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[userRole as keyof typeof roleColors] || ''}`}>
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </span>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">
          Fincortex
        </Link>

        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks">
          <li><a href="#home" onClick={handleLinkClick}>Home</a></li>
          <li><a href="#features" onClick={handleLinkClick}>Features</a></li>
          <li><a href="#works" onClick={handleLinkClick}>How It Works</a></li>
          <li><a href="#solutions" onClick={handleLinkClick}>Solutions</a></li>
          <li><a href="#about" onClick={handleLinkClick}>About</a></li>
          <li><a href="#contact" onClick={handleLinkClick}>Contact</a></li>
        </ul>

        {/* Mobile: Guest centered or User info centered */}
        {!user || !userProfile ? (
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 text-sm font-medium text-primary">
            Guest
          </div>
        ) : (
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 text-center">
            <div className="text-sm font-medium text-primary">{displayName}</div>
            {userRole && (
              <div className="mt-0.5 flex justify-center">{getRoleBadge()}</div>
            )}
          </div>
        )}

        <div className="nav-cta">
          {user && userProfile ? (
            <>
              {/* Desktop: User info (full name + role) */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">{displayName}</div>
                  {userRole && (
                    <div className="mt-0.5">{getRoleBadge()}</div>
                  )}
                </div>
              </div>

              {/* Mobile: User info (full name + role) */}
              <div className="md:hidden flex items-center">
                {/* Already shown in centered position above */}
              </div>
            </>
          ) : (
            /* Anonymous user: Show "Guest" on desktop right side */
            <div className="hidden md:block text-sm font-medium text-primary">
              Guest
            </div>
          )}
          <button className="theme-toggle p-1.5 w-8 h-8 flex items-center justify-center" onClick={toggleTheme}>
            <div className="theme-icon text-sm">{themeIcon}</div>
          </button>
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
    </nav>
  );
}