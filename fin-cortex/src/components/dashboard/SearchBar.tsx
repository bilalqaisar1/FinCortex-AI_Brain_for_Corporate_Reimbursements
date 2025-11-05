"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
  className?: string;
  loading?: boolean;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  showFilter = false,
  onFilterClick,
  className,
  loading = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "relative transition-all duration-200",
        isFocused && "scale-105"
      )}>
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors",
          isFocused ? "text-blue-600" : "text-slate-400"
        )} />
        
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 pr-20 rounded-full border-slate-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200",
            isFocused && "shadow-lg ring-2 ring-blue-100"
          )}
          disabled={loading}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {showFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilterClick}
              className="h-6 w-6 p-0 hover:bg-purple-50 hover:text-blue-600 rounded-full"
            >
              <Filter className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
          <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
