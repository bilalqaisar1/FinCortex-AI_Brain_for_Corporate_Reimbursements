"use client";

import { useState, ReactNode } from "react";
import { ManagerSidebar } from "./ManagerSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react";
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

interface ManagerLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ManagerLayout({ children, className }: ManagerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Manager";

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden relative z-10">
        <ManagerSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
          {/* Top Header - Sticky Glassmorphic */}
          <header className="bg-[var(--background-dark)]/40 backdrop-blur-2xl border-b border-[var(--border-subtle)] px-8 py-4 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="lg:hidden hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <div className="flex flex-col">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-0.5">Management Suite</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Active Session:</span>
                    <span className="text-sm font-black text-purple-400 uppercase tracking-widest">{displayName}</span>
                  </div>
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
                      <Avatar className="h-10 w-10 rounded-2xl border border-[var(--border-subtle)] group-hover:border-purple-500/50 transition-all">
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
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase truncate">
                          {userProfile?.email || user?.email}
                        </p>
                        <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                          MANAGER ROLE
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
                    <DropdownMenuItem asChild className="p-3 focus:bg-[var(--card-hover)] cursor-pointer rounded-xl group">
                      <Link href="/manager/profile" className="flex items-center w-full">
                        <User className="mr-3 h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="p-3 focus:bg-[var(--card-hover)] cursor-pointer rounded-xl group">
                      <Link href="/manager/settings" className="flex items-center w-full">
                        <Settings className="mr-3 h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Settings</span>
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
                  <Button variant="ghost" size="icon" className="hover:bg-[var(--card-hover)] text-[var(--text-secondary)]">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-[var(--background-secondary)] border-[var(--border-subtle)]">
                  <ManagerSidebar onToggle={() => setMobileSidebarOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-lg">F</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 hover:bg-[var(--card-hover)]">
                    <Avatar className="h-9 w-9 rounded-xl border border-[var(--border-subtle)]">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-[#6366f1] to-[#ec4899] text-white rounded-xl text-xs font-black">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[var(--background-dark)]/95 backdrop-blur-2xl border-[var(--border-subtle)]">
                  {/* Mobile content simplified */}
                </DropdownMenuContent>
              </DropdownMenu>
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

