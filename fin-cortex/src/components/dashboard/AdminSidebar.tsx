"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Building2,
  DollarSign,
  Bot,
  History,
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  Home,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: SidebarItem[];
}

interface AdminSidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Managers",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Budget",
    href: "/admin/budget",
    icon: DollarSign,
  },
  {
    title: "Policy Rules",
    href: "/admin/policy-rules",
    icon: Shield,
  },
  {
    title: "AI Assistant",
    href: "/admin/assistant",
    icon: Bot,
    badge: "AI",
  },
];

export function AdminSidebar({
  className,
  collapsed = false,
  onToggle
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };


  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--background-secondary)] border-r border-[var(--border-subtle)] transition-all duration-500 relative z-40",
      collapsed ? "w-20" : "w-72",
      className
    )}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none opacity-50 dark:opacity-100" />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] relative z-10">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Admin Panel</span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "rounded-full bg-[var(--card-dark)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 shadow-sm",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Search / Quick Actions */}
      {!collapsed && (
        <div className="p-6 space-y-4 relative z-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="GLOBAL SEARCH..."
              className="w-full pl-11 pr-4 py-3 text-[10px] font-black tracking-widest bg-[var(--card-dark)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all placeholder:text-[var(--text-muted)] shadow-sm"
            />
          </div>
          <Button
            variant="brand"
            className="w-full h-12 text-[10px] font-black tracking-widest"
            onClick={() => window.location.href = "/admin/users/create"}
          >
            <Plus className="w-4 h-4 mr-2" />
            QUICK ADD MANAGER
          </Button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6 relative z-10">
        <nav className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isItemActive = isActive(item.href);
            const Icon = item.icon;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                    isItemActive
                      ? "bg-[var(--card-dark)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {isItemActive && (
                    <div className="absolute left-0 w-1 h-6 bg-gradient-to-b from-[#6366f1] to-[#ec4899] rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}

                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-all duration-300",
                    isItemActive ? "text-purple-400" : "group-hover:scale-110 group-hover:text-white"
                  )} />

                  {!collapsed && (
                    <span className={cn(
                      "flex-1 text-[11px] font-black uppercase tracking-[0.2em] transition-colors",
                      isItemActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      {item.title}
                    </span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border-subtle)] relative z-10">
        {!collapsed ? (
          <div className="flex flex-col gap-1 items-center justify-center opacity-40">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">FinCortex Admin</p>
            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Enterprise Controller v2.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}