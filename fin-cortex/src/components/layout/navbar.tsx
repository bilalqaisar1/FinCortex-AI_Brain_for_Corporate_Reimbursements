"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme, themeIcon } = useTheme();
  const { user, userProfile } = useAuth();

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Admin";

  const navCtaHref = user ? "/user/dashboard" : "/login";

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

        <div className="nav-cta">
          <div className="admin-label">{displayName}</div>
          <Link href={navCtaHref} className="btn btn-outline">
            <span>👤</span>
          </Link>
          <button className="theme-toggle" onClick={toggleTheme}>
            <div className="theme-icon">{themeIcon}</div>
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