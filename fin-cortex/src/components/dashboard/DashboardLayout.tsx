"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, User, Search, Moon, Sun, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/NotificationCenter";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Admin";

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine profile link based on user role
  const getProfileHref = () => {
    if (!user || !userProfile) return "/login";

    const role = userProfile.userRole;

    if (role === 'admin') {
      return "/admin";
    } else if (role === 'manager') {
      return "/manager";
    } else if (role === 'user') {
      return "/user/profile";
    }

    // Fallback
    if (userProfile.employee_code !== undefined) {
      return "/user/profile";
    }

    return "/admin";
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[var(--background-dark)] transition-all duration-500 overflow-x-hidden">
      {/* Background Decorative Glows */}
      <div className="fixed top-20 left-20 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-20 right-20 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden relative z-10">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
          {/* Top Header - Glassmorphic Admin Style */}
          <header className="bg-[var(--background-dark)]/40 backdrop-blur-3xl border-b border-[var(--border-subtle)] px-8 py-4 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="lg:hidden hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <div className="relative group hidden sm:block">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="ADMIN CONSOLE SEARCH..."
                    className="w-80 pl-11 pr-4 py-2.5 text-[10px] font-black tracking-widest bg-[var(--card-dark)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full bg-[var(--card-dark)] border border-[var(--border-medium)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300"
                >
                  {isDarkTheme ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>

                <div className="h-6 w-px bg-[var(--border-medium)]" />

                <NotificationCenter />

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-2xl p-0 hover:bg-[var(--card-hover)] transition-all duration-300 group">
                      <Avatar className="h-10 w-10 rounded-2xl border border-[var(--border-subtle)] group-hover:border-purple-500/50 transition-all shadow-sm">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-[#6366f1] to-[#ec4899] text-white rounded-2xl font-black">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-[var(--background-dark)]/90 backdrop-blur-3xl border-[var(--border-medium)] p-2">
                    <DropdownMenuLabel className="p-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{displayName}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase truncate">
                          {userProfile?.email || user?.email}
                        </p>
                        <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest leading-none">
                          ADMINISTRATOR ROLE
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
                    <DropdownMenuItem asChild className="p-3 focus:bg-[var(--card-hover)] cursor-pointer rounded-xl group">
                      <Link href={getProfileHref()} className="flex items-center w-full">
                        <User className="mr-3 h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="p-3 focus:bg-[var(--card-hover)] cursor-pointer rounded-xl group">
                      <Link href={`${getProfileHref()}/settings`} className="flex items-center w-full">
                        <Settings className="mr-3 h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
                    <DropdownMenuItem onClick={handleSignOut} className="p-3 focus:bg-red-500/10 cursor-pointer rounded-xl group">
                      <LogOut className="mr-3 h-4 w-4 text-red-500/70" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Secure Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className={cn("flex-1 p-8 lg:p-10 overflow-auto scrollbar-hide relative z-10", className)}>
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden relative z-10">
        <header className="bg-[var(--background-dark)]/60 backdrop-blur-xl border-b border-[var(--border-subtle)] px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-[var(--card-hover)] text-[var(--text-muted)]">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-[var(--background-dark)] border-[var(--border-medium)]">
                  <AdminSidebar onToggle={() => setMobileSidebarOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-lg">F</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className={cn("p-6 overflow-auto min-h-screen", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
