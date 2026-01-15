"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ManagerLayout } from "@/components/dashboard/ManagerLayout";
import { useAuth } from "@/context/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  FileText,
  Loader2
} from "lucide-react";
import { PageHeader } from "@/components/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data - replace with actual API call
const mockApprovals = [
  {
    approval_id: "1",
    reimbursement_id: "1",
    receipt_code: "RCP-2024-001",
    user_name: "John Smith",
    amount_claimed: 15000,
    category: "Travel",
    description: "Business trip to Karachi",
    submitted_at: "2024-01-15T10:30:00Z",
    priority: "high",
    decision: "Pending"
  },
  {
    approval_id: "2",
    reimbursement_id: "2",
    receipt_code: "RCP-2024-002",
    user_name: "Sarah Ahmed",
    amount_claimed: 8500,
    category: "Meals",
    description: "Client meeting lunch",
    submitted_at: "2024-01-14T14:20:00Z",
    priority: "medium",
    decision: "Pending"
  },
  {
    approval_id: "3",
    reimbursement_id: "3",
    receipt_code: "RCP-2024-003",
    user_name: "Ali Khan",
    amount_claimed: 3200,
    category: "Office Supplies",
    description: "Stationery for office",
    submitted_at: "2024-01-13T09:15:00Z",
    priority: "low",
    decision: "Pending"
  }
];

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [decisionType, setDecisionType] = useState<"approved" | "rejected" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApprovals = async () => {
    if (!userProfile?.user_id) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/reimbursements/manager/${userProfile.user_id}`);
      const payload = await response.json();
      if (payload.success) {
        // Filter for pending only if needed, or show all
        setApprovals(payload.data.filter((a: any) => a.status === 'pending'));
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [userProfile?.user_id]);

  const handleApprove = async (approval: any) => {
    setSelectedApproval(approval);
    setDecisionType("approved");
    setIsDialogOpen(true);
  };

  const handleReject = async (approval: any) => {
    setSelectedApproval(approval);
    setDecisionType("rejected");
    setIsDialogOpen(true);
  };

  const confirmDecision = async () => {
    if (!decisionType) return;
    if (decisionType === "rejected" && !comment.trim()) return;

    setIsProcessing(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/reimbursements/${selectedApproval.reimbursement_id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decisionType,
          comments: comment,
          approver_id: userProfile?.user_id
        })
      });
      const payload = await response.json();
      if (payload.success) {
        setIsDialogOpen(false);
        setComment("");
        setSelectedApproval(null);
        setDecisionType(null);
        fetchApprovals(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <RouteProtection allowedRoles={['manager']}>
      <ManagerLayout>
        <div className="w-full max-w-full overflow-hidden">
          <PageHeader
            title="Pending Approvals"
            description="Review and approve reimbursement claims from your team"
            icon={Clock}
            iconColor="text-orange-600 dark:text-orange-400"
            iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          />

          {/* Approvals List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading pending approvals...</p>
              </div>
            ) : approvals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
                <p className="text-slate-600 dark:text-slate-400">No pending reimbursement claims to review.</p>
              </div>
            ) : (
              approvals.map((approval) => (
                <Card
                  key={approval.reimbursement_id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Section - Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {approval.receipt_code}
                              </h3>
                              <Badge className={priorityColors[(approval.priority || 'medium') as keyof typeof priorityColors]}>
                                {((approval.priority || 'medium') as string).toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{approval.users?.full_name || approval.full_name || "Employee"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4" />
                                <span>PKR {parseFloat(approval.amount_claimed).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{approval.categories?.category_name || approval.category_name || "Uncategorized"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(approval.created_at || approval.submitted_at)}</span>
                              </div>
                            </div>
                            {approval.policy_flags && approval.policy_flags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {approval.policy_flags.map((flag: any, fIdx: number) => (
                                  <Badge key={fIdx} variant="outline" className="text-[10px] border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {flag.message}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {approval.description && (
                              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {approval.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/manager/reimbursements/${approval.reimbursement_id}`)}
                          className="flex-1 hover:bg-purple-50 dark:hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(approval)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Approval/Rejection Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle>
                  {decisionType === "approved" ? "Approve" : "Reject"} Reimbursement
                </DialogTitle>
                <DialogDescription>
                  {decisionType === "approved"
                    ? "Are you sure you want to approve this reimbursement claim?"
                    : "Are you sure you want to reject this reimbursement claim? Please provide a reason."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedApproval && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {selectedApproval.receipt_code}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedApproval.user_name} • PKR {selectedApproval.amount_claimed.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    {decisionType === "approved" ? "Comments (Optional)" : "Reason for Rejection *"}
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={decisionType === "approved"
                      ? "Add any comments..."
                      : "Please provide a reason for rejection..."}
                    className="min-h-[100px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    required={decisionType === "rejected"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setComment("");
                    setDecisionType(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDecision}
                  disabled={isProcessing || (decisionType === "rejected" && !comment.trim())}
                  className={decisionType === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"}
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {decisionType === "approved" ? "Approve" : "Reject"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ManagerLayout>
    </RouteProtection>
  );
}

