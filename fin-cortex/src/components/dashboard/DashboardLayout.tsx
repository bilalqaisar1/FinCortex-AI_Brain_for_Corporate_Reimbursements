"use client";

import { useState, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, User, Search, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-300">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {/* Top Header - Enhanced Responsiveness */}
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:hidden hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search admin panel..."
                    className="w-48 lg:w-64 pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleTheme}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  {isDarkTheme ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                  )}
                </Button>
                
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800 relative">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </header>
          
          {/* Page Content - Enhanced Responsiveness */}
          <main className={cn("flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-w-0", className)}>
            <div className="max-w-full overflow-x-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout - Enhanced */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800">
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <AdminSidebar />
                </SheetContent>
              </Sheet>
              
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs sm:text-sm">F</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">FinCortex</span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                {isDarkTheme ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800 relative">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Mobile Content - Enhanced */}
        <main className={cn("p-3 sm:p-4 overflow-auto min-h-screen", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
