"use client";

import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  DollarSign,
  Users,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  key: string;
  label: string;
  type: "select" | "input" | "date" | "number";
  options?: FilterOption[];
  placeholder?: string;
  icon?: ReactNode;
}

interface FilterPanelProps {
  fields: FilterField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  onApply: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FilterPanel({
  fields,
  values,
  onChange,
  onClear,
  onApply,
  className,
  collapsible = false,
  defaultCollapsed = true,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.values(values).filter(value => 
    value !== "" && value !== null && value !== undefined
  ).length;

  const getFieldIcon = (field: FilterField) => {
    if (field.icon) return field.icon;
    
    switch (field.key) {
      case "date":
      case "created_at":
      case "updated_at":
        return <Calendar className="w-4 h-4" />;
      case "amount":
      case "price":
      case "cost":
        return <DollarSign className="w-4 h-4" />;
      case "department":
      case "company":
        return <Building2 className="w-4 h-4" />;
      case "user":
      case "employee":
        return <Users className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  const renderField = (field: FilterField) => {
    const icon = getFieldIcon(field);
    
    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
              {icon}
              <span>{field.label}</span>
            </Label>
            <Select
              value={values[field.key] || ""}
              onValueChange={(value) => onChange(field.key, value)}
            >
              <SelectTrigger className="rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-200">
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "input":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
              {icon}
              <span>{field.label}</span>
            </Label>
            <Input
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label}`}
              className="rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        );

      case "date":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
              {icon}
              <span>{field.label}</span>
            </Label>
            <Input
              type="date"
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
              {icon}
              <span>{field.label}</span>
            </Label>
            <Input
              type="number"
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label}`}
              className="rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (collapsible) {
    return (
      <div className={cn("space-y-4", className)}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between hover:bg-purple-50 hover:border-purple-200"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {isOpen && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map(renderField)}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={onClear}
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                
                <Button
                  onClick={onApply}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(renderField)}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClear}
            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          
          <Button
            onClick={onApply}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
