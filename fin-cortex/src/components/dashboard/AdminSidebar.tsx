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
  Home
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
    title: "Violations",
    href: "/admin/violations",
    icon: AlertTriangle,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
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

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isItemActive = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const Icon = item.icon;

    return (
      <div key={item.href} className="space-y-1">
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              "hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-purple-700 dark:hover:text-purple-400",
              isItemActive
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400",
              level > 0 && "ml-4",
              collapsed && "justify-center px-2"
            )}
          >
            <Icon className={cn(
              "w-4 h-4 flex-shrink-0",
              isItemActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            )} />

            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>

          {hasChildren && !collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(item.title)}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-slate-800"
            >
              {isExpanded ? (
                <ChevronRight className="w-3 h-3 rotate-90" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        {hasChildren && !collapsed && isExpanded && (
          <div className="space-y-1 ml-4">
            {item.children?.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">FinCortex</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 focus:border-purple-300 dark:focus:border-purple-600"
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {!collapsed ? (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            <p>FinCortex Admin</p>
            <p>v2.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}