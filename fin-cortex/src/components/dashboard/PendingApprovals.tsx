"use client";

import { useState } from "react";
import { 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  DollarSign,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PendingApproval {
  id: string;
  user: string;
  amount: string;
  category: string;
  reason: string;
  priority: "high" | "medium" | "low";
  submitted: string;
  department?: string;
  manager?: string;
}

interface PendingApprovalsProps {
  approvals?: PendingApproval[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
}

const mockApprovals: PendingApproval[] = [
  {
    id: "R-001",
    user: "John Smith",
    amount: "PKR 80,000",
    category: "Medical",
    reason: "Exceeds annual cap",
    priority: "high",
    submitted: "2 hours ago",
    department: "Engineering",
    manager: "Sarah Ahmed"
  },
  {
    id: "R-002", 
    user: "Sarah Ahmed",
    amount: "PKR 15,000",
    category: "Travel",
    reason: "Unknown vendor",
    priority: "medium",
    submitted: "4 hours ago",
    department: "Marketing",
    manager: "Ali Khan"
  },
  {
    id: "R-003",
    user: "Ali Khan",
    amount: "PKR 5,000",
    category: "Meals",
    reason: "Exceeds daily limit",
    priority: "low",
    submitted: "6 hours ago",
    department: "Sales",
    manager: "John Smith"
  },
  {
    id: "R-004",
    user: "Maria Garcia",
    amount: "PKR 25,000",
    category: "Equipment",
    reason: "Requires manager approval",
    priority: "high",
    submitted: "1 day ago",
    department: "IT",
    manager: "Sarah Ahmed"
  }
];

export function PendingApprovals({ 
  approvals = mockApprovals,
  onApprove,
  onReject,
  onView,
  className 
}: PendingApprovalsProps) {
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedApprovals.length === approvals.length) {
      setSelectedApprovals([]);
    } else {
      setSelectedApprovals(approvals.map(a => a.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedApprovals(prev => 
      prev.includes(id) 
        ? prev.filter(approvalId => approvalId !== id)
        : [...prev, id]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="w-3 h-3" />;
      case "medium": return <Clock className="w-3 h-3" />;
      case "low": return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Card className={cn("bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-orange-500" />
            Pending Approvals
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {approvals.length} items
            </Badge>
            {selectedApprovals.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => selectedApprovals.forEach(id => onApprove?.(id))}
                  className="h-8 px-3 text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => selectedApprovals.forEach(id => onReject?.(id))}
                  className="h-8 px-3 text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Select All */}
        <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <input
            type="checkbox"
            checked={selectedApprovals.length === approvals.length && approvals.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Select All ({selectedApprovals.length}/{approvals.length})
          </span>
        </div>

        {/* Approvals List */}
        {approvals.map((approval, index) => (
          <div 
            key={approval.id}
            className={cn(
              "flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200",
              selectedApprovals.includes(approval.id)
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            <input
              type="checkbox"
              checked={selectedApprovals.includes(approval.id)}
              onChange={() => handleSelect(approval.id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {approval.id}
                </span>
                <Badge 
                  variant="outline"
                  className={cn("text-xs flex items-center space-x-1", getPriorityColor(approval.priority))}
                >
                  {getPriorityIcon(approval.priority)}
                  <span>{approval.priority}</span>
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900 dark:text-slate-100">{approval.user}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{approval.department}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{approval.amount}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{approval.category}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-500">{approval.submitted}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">Manager: {approval.manager}</span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-medium">Reason:</span> {approval.reason}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onView?.(approval.id)}
                className="h-8 px-3"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onApprove?.(approval.id)}
                className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onReject?.(approval.id)}
                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
        
        {approvals.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No pending approvals</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">All caught up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
