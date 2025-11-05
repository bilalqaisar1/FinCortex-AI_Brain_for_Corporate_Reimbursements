"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  User,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  Clock,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PolicyViolation {
  id: string;
  userId: string;
  userName: string;
  reimbursementId: string;
  amount: string;
  violationType: "restricted_item" | "amount_exceeded" | "unauthorized_vendor" | "duplicate_claim" | "policy_breach";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  detectedAt: string;
  category: string;
  department: string;
  manager: string;
}

interface PolicyViolationsProps {
  violations?: PolicyViolation[];
  onView?: (violationId: string) => void;
  onResolve?: (violationId: string) => void;
  onDismiss?: (violationId: string) => void;
  className?: string;
}

const mockViolations: PolicyViolation[] = [
  {
    id: "V-001",
    userId: "U-001",
    userName: "John Smith",
    reimbursementId: "R-001",
    amount: "PKR 3,000",
    violationType: "restricted_item",
    description: "Alcohol purchase not allowed under company policy",
    severity: "high",
    status: "pending",
    detectedAt: "2 hours ago",
    category: "Meals",
    department: "Engineering",
    manager: "Sarah Ahmed"
  },
  {
    id: "V-002",
    userId: "U-002",
    userName: "Sarah Ahmed",
    reimbursementId: "R-002",
    amount: "PKR 15,000",
    violationType: "amount_exceeded",
    description: "Travel expense exceeds monthly limit by PKR 5,000",
    severity: "medium",
    status: "reviewed",
    detectedAt: "4 hours ago",
    category: "Travel",
    department: "Marketing",
    manager: "Ali Khan"
  },
  {
    id: "V-003",
    userId: "U-003",
    userName: "Ali Khan",
    reimbursementId: "R-003",
    amount: "PKR 8,000",
    violationType: "duplicate_claim",
    description: "Similar receipt submitted within 30 days",
    severity: "critical",
    status: "pending",
    detectedAt: "6 hours ago",
    category: "Equipment",
    department: "Sales",
    manager: "John Smith"
  },
  {
    id: "V-004",
    userId: "U-004",
    userName: "Maria Garcia",
    reimbursementId: "R-004",
    amount: "PKR 2,500",
    violationType: "unauthorized_vendor",
    description: "Vendor not in approved list",
    severity: "low",
    status: "resolved",
    detectedAt: "1 day ago",
    category: "Office Supplies",
    department: "IT",
    manager: "Sarah Ahmed"
  }
];

export function PolicyViolations({ 
  violations = mockViolations,
  onView,
  onResolve,
  onDismiss,
  className 
}: PolicyViolationsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed" | "resolved" | "dismissed">("all");

  const filteredViolations = violations.filter(violation => {
    const matchesSearch = violation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.reimbursementId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || violation.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || violation.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "reviewed": return "bg-blue-100 text-blue-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "dismissed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case "restricted_item": return <Shield className="w-4 h-4" />;
      case "amount_exceeded": return <DollarSign className="w-4 h-4" />;
      case "unauthorized_vendor": return <User className="w-4 h-4" />;
      case "duplicate_claim": return <FileText className="w-4 h-4" />;
      case "policy_breach": return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-3 h-3" />;
      case "high": return <AlertTriangle className="w-3 h-3" />;
      case "medium": return <Clock className="w-3 h-3" />;
      case "low": return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatViolationType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Search and Filters */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
            Policy Violations
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search violations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations List */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredViolations.map((violation, index) => (
              <div 
                key={violation.id}
                className={cn(
                  "p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                  index === 0 && "rounded-t-lg"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* Violation Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      violation.severity === "critical" ? "bg-red-100 text-red-600" :
                      violation.severity === "high" ? "bg-orange-100 text-orange-600" :
                      violation.severity === "medium" ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {getViolationIcon(violation.violationType)}
                    </div>
                    
                    {/* Violation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatViolationType(violation.violationType)}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={cn("text-xs flex items-center space-x-1", getSeverityColor(violation.severity))}
                        >
                          {getSeverityIcon(violation.severity)}
                          <span className="capitalize">{violation.severity}</span>
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={cn("text-xs", getStatusColor(violation.status))}
                        >
                          {violation.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {violation.description}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <User className="w-4 h-4" />
                            <span>{violation.userName}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{violation.amount}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <FileText className="w-4 h-4" />
                            <span>{violation.reimbursementId}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>{violation.detectedAt}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          <span className="font-medium">Category:</span> {violation.category} • 
                          <span className="font-medium"> Department:</span> {violation.department} • 
                          <span className="font-medium"> Manager:</span> {violation.manager}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onView?.(violation.id)}
                      className="h-8 px-3"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    
                    {violation.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onResolve?.(violation.id)}
                          className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onDismiss?.(violation.id)}
                          className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredViolations.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No violations found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
