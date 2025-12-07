"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Shield } from "lucide-react";

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

  const userEmail = userProfile?.email || user?.email || "";
  const userRole = userProfile?.userRole || (userProfile?.employee_code !== undefined ? 'user' : null);

  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine dashboard href based on user role
  const getDashboardHref = () => {
    if (!user || !userProfile) return "/login";
    
    const role = userProfile.userRole;
    
    if (role === 'admin') {
      return "/admin";
    } else if (role === 'manager') {
      return "/manager";
    } else if (role === 'user') {
      return "/user/dashboard";
    }
    
    // Fallback: try to infer from profile structure
    if (userProfile.employee_code !== undefined) {
      return "/user/dashboard";
    }
    
    return "/login";
  };

  const navCtaHref = getDashboardHref();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

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
          {user && userProfile && (
            <li className="md:hidden">
              <Link href={navCtaHref} onClick={() => setIsMobileMenuOpen(false)}>
                <Shield className="w-4 h-4 inline mr-2" />
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-cta">
          {user && userProfile ? (
            <>
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">{displayName}</div>
                  {userEmail && (
                    <div className="text-xs text-muted truncate max-w-[150px]">{userEmail}</div>
                  )}
                  {userRole && (
                    <div className="mt-0.5">{getRoleBadge()}</div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn btn-outline p-0 w-10 h-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        {userEmail && (
                          <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        )}
                        {userRole && (
                          <div className="mt-1">{getRoleBadge()}</div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={navCtaHref} className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${navCtaHref}/profile`} className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${navCtaHref}/settings`} className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="md:hidden flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn btn-outline p-0 w-10 h-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        {userEmail && (
                          <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        )}
                        {userRole && (
                          <div className="mt-1">{getRoleBadge()}</div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={navCtaHref} className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${navCtaHref}/profile`} className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${navCtaHref}/settings`} className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link href="/login" className="btn btn-outline p-0 w-10 h-10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </Link>
          )}
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