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

// Import from generic api file or define here matching API
import { PolicyViolation } from "@/app/api/v1/admin/policy-rules-api";

interface PolicyViolationsProps {
  violations?: PolicyViolation[];
  onView?: (violationId: string) => void;
  onResolve?: (violationId: string) => void;
  onDismiss?: (violationId: string) => void;
  className?: string;
}

export function PolicyViolations({
  violations = [],
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
      case "critical": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-[var(--card-dark)] text-[var(--text-muted)] border-[var(--border-subtle)]";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "reviewed": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "resolved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "dismissed": return "bg-[var(--card-dark)] text-[var(--text-muted)] border-[var(--border-subtle)]";
      default: return "bg-[var(--card-dark)] text-[var(--text-muted)] border-[var(--border-subtle)]";
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
      <Card className="bg-[var(--card-dark)] backdrop-blur-xl border-[var(--border-subtle)] shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black text-[var(--text-primary)] flex items-center uppercase tracking-tight">
            <AlertTriangle className="w-6 h-6 mr-2 text-purple-400" />
            Policy Violations
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="Search violations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[var(--card-dark)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-2 border border-[var(--border-medium)] rounded-lg bg-[var(--card-dark)] text-[var(--text-primary)] text-sm"
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
                className="px-3 py-2 border border-[var(--border-medium)] rounded-lg bg-[var(--card-dark)] text-[var(--text-primary)] text-sm"
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
      <Card className="bg-[var(--card-dark)] backdrop-blur-xl border-[var(--border-subtle)] shadow-2xl">
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredViolations.map((violation, index) => (
              <div
                key={violation.id}
                className={cn(
                  "p-4 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--card-hover)] transition-colors",
                  index === 0 && "rounded-t-lg"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* Violation Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      violation.severity === "critical" ? "bg-red-500/10 text-red-400" :
                        violation.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                          violation.severity === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-blue-500/10 text-blue-400"
                    )}>
                      {getViolationIcon(violation.violationType)}
                    </div>

                    {/* Violation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-[var(--text-primary)]">
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
                        <p className="text-sm text-[var(--text-secondary)]">
                          {violation.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                            <User className="w-4 h-4" />
                            <span>{violation.userName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                            <DollarSign className="w-4 h-4" />
                            <span>{violation.amount}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                            <FileText className="w-4 h-4" />
                            <span>{violation.reimbursementId}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                            <Calendar className="w-4 h-4" />
                            <span>{violation.detectedAt}</span>
                          </div>
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
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
                      className="h-8 px-3 bg-[var(--card-dark)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
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
                          className="h-8 px-3 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDismiss?.(violation.id)}
                          className="h-8 px-3 text-red-400 border-red-500/20 hover:bg-red-500/10"
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
                <AlertTriangle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">No violations found</p>
                <p className="text-sm text-[var(--text-muted)]">
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
