"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, FileDown, ExternalLink, ReceiptText, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserNavbar } from "@/components/dashboard/UserNavbar";

type ClaimStatus = "Approved" | "Pending" | "Rejected";

interface ClaimItem {
  reimbursement_id: string;
  receipt_code: string;
  category_name: string;
  created_at: string;
  status: string;
  amount_claimed: string;
}

const mockClaims: ClaimItem[] = []; // Replaced by fetched data

function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function withinDays(dateISO: string, days: number) {
  const now = new Date();
  const dt = new Date(dateISO);
  const ms = days * 24 * 60 * 60 * 1000;
  return now.getTime() - dt.getTime() <= ms;
}

export default function ClaimHistoryPage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/reimbursements/user/${user.id}`);
      const payload = await response.json();
      if (payload.success) {
        setClaims(payload.data.map((item: any) => ({
          ...item,
          category_name: item.categories?.category_name || item.category_name || "Uncategorized"
        })));
      }
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [user?.id]);


  // Filters
  const [timeRange, setTimeRange] = useState<string>("7d"); // "today" | "7d" | "30d" | "custom"
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimStatus>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const filteredClaims = useMemo(() => {
    let list = [...claims];
    // Status filter
    if (statusFilter !== "all") list = list.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase());
    // Time filter
    if (timeRange === "today") {
      const today = new Date();
      list = list.filter((c) => {
        const d = new Date(c.created_at);
        return d.toDateString() === today.toDateString();
      });
    } else if (timeRange === "7d") {
      list = list.filter((c) => withinDays(c.created_at, 7));
    } else if (timeRange === "30d") {
      list = list.filter((c) => withinDays(c.created_at, 30));
    } else if (timeRange === "custom" && customFrom && customTo) {
      const from = new Date(customFrom).getTime();
      const to = new Date(customTo).getTime();
      list = list.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= from && t <= to;
      });
    }
    return list;
  }, [claims, timeRange, statusFilter, customFrom, customTo]);

  const stats = useMemo(() => {
    const total = filteredClaims.length;
    const approved = filteredClaims.filter((c) => c.status.toLowerCase() === "approved").length;
    const pending = filteredClaims.filter((c) => c.status.toLowerCase() === "pending").length;
    const rejected = filteredClaims.filter((c) => c.status.toLowerCase() === "rejected").length;
    return { total, approved, pending, rejected };
  }, [filteredClaims]);

  const recentSix = useMemo(() => {
    return [...filteredClaims]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [filteredClaims]);

  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);

  function statusBadgeClass(status: string) {
    const s = status.toLowerCase();
    if (s === "approved") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    if (s === "pending") return "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    return "bg-red-500/15 text-red-400 border border-red-500/20";
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full">
      {/* Navbar */}
      <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />

      <main className="flex min-h-[100dvh] flex-1 flex-col pt-20">
        {/* Page header */}
        <div className="border-b border-subtle glass-effect px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="size-6 md:size-7 text-primary" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-primary">Claim History</h1>
              <p className="text-xs md:text-sm text-muted">Track, filter, and download your claims</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          {/* Stat cards with icons */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-effect border-subtle hover-lift animate-fade-in-up">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">Total Claims</p>
                  <div className="rounded-md bg-[#233648]/40 p-2">
                    <ReceiptText className="size-5 text-primary" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="glass-effect border-subtle hover-lift animate-fade-in-up">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">Approved</p>
                  <div className="rounded-md bg-[#233648]/40 p-2">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-400">{stats.approved}</p>
              </CardContent>
            </Card>
            <Card className="glass-effect border-subtle hover-lift animate-fade-in-up">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">Pending</p>
                  <div className="rounded-md bg-[#233648]/40 p-2">
                    <Clock className="size-5 text-amber-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-400">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="glass-effect border-subtle hover-lift animate-fade-in-up">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">Rejected</p>
                  <div className="rounded-md bg-[#233648]/40 p-2">
                    <XCircle className="size-5 text-red-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-red-400">{stats.rejected}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Claims - cards */}
          <div className="mb-6">
            <h2 className="mb-3 text-[18px] font-semibold text-primary">Recent Claims</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-10">
                  <Loader2 className="size-8 text-primary animate-spin" />
                </div>
              ) : recentSix.length === 0 ? (
                <div className="col-span-full text-center py-10 text-muted">No recent claims found.</div>
              ) : (
                recentSix.map((c) => (
                  <Card key={c.reimbursement_id} className="glass-effect border-subtle transition-all duration-200 hover:shadow-theme-lg hover:bg-card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{c.receipt_code}</p>
                          <p className="text-xs text-muted">{c.category_name}</p>
                        </div>
                        <Badge className={`text-xs ${statusBadgeClass(c.status)}`}>{c.status}</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted">
                          {new Date(c.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm font-bold text-primary">{formatCurrencyINR(parseFloat(c.amount_claimed))}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Filters - positioned just above the table */}
          <Card className="glass-effect border-subtle mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px] text-primary">Filters</CardTitle>
              <CardDescription>Refine your claim history</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs text-muted">Time</p>
                <Select value={timeRange} onValueChange={(v) => setTimeRange(v)}>
                  <SelectTrigger className="w-full border-subtle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {timeRange === "custom" && (
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs text-muted">Custom range</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border-subtle" />
                    <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border-subtle" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted">Status</p>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-full border-subtle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Claim History table */}
          <Card className="glass-effect border-subtle">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[18px] text-primary">All Claims</CardTitle>
                  <CardDescription>Comprehensive list of your submissions</CardDescription>
                </div>
                <div className="text-xs text-muted">{filteredClaims.length} records</div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className={`sticky top-0 ${isDarkTheme ? "bg-[#233648]/50" : "bg-white/80"} backdrop-blur-sm text-[#92adc9] z-10`}>
                    <TableRow>
                      <TableHead className="px-6 py-3 whitespace-nowrap">ID</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap">Category</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap">Submission Date</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap">Status</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap text-right">Amount</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap text-center">View</TableHead>
                      <TableHead className="px-6 py-3 whitespace-nowrap text-center">Download PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <Loader2 className="size-6 text-primary animate-spin inline mr-2" />
                          Loading claims...
                        </TableCell>
                      </TableRow>
                    ) : filteredClaims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted">No claims found match your filters.</TableCell>
                      </TableRow>
                    ) : (
                      filteredClaims.map((c) => (
                        <TableRow key={c.reimbursement_id} className="border-[#324d67] hover:bg-[#233648]/30">
                          <TableCell className="px-6 py-4 font-medium text-primary whitespace-nowrap">{c.receipt_code}</TableCell>
                          <TableCell className="px-6 py-4 text-muted whitespace-nowrap">{c.category_name}</TableCell>
                          <TableCell className="px-6 py-4 text-muted whitespace-nowrap">
                            {new Date(c.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`text-xs ${statusBadgeClass(c.status)}`}>{c.status}</Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right text-primary whitespace-nowrap">{formatCurrencyINR(parseFloat(c.amount_claimed))}</TableCell>
                          <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                            <Button variant="ghost" size="sm" className="text-[#92adc9] hover:text-white" onClick={() => setSelectedClaim(c)}>
                              <ExternalLink className="size-4 mr-1" /> View
                            </Button>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                            <Button variant="ghost" size="sm" className="text-[#92adc9] hover:text-white">
                              <FileDown className="size-4 mr-1" /> PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          {selectedClaim && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedClaim(null)} />
              <div className="relative w-full sm:max-w-lg sm:rounded-xl bg-surface-elevated border border-subtle glass-effect p-0 m-0 sm:m-4">
                <div className="border-b border-subtle px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Claim</p>
                    <p className="text-lg font-semibold text-primary">{selectedClaim.receipt_code}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-subtle" onClick={() => setSelectedClaim(null)}>Close</Button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Category</span>
                    <span className="text-sm text-primary font-medium">{selectedClaim.category_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Submission Date</span>
                    <span className="text-sm text-primary font-medium">{new Date(selectedClaim.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Status</span>
                    <Badge className={`text-xs ${statusBadgeClass(selectedClaim.status)}`}>{selectedClaim.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Amount</span>
                    <span className="text-sm text-primary font-bold">{formatCurrencyINR(parseFloat(selectedClaim.amount_claimed))}</span>
                  </div>
                </div>
                <div className="border-t border-subtle px-4 py-3 flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="border-subtle" onClick={() => setSelectedClaim(null)}>Close</Button>
                  <Button variant="ghost" size="sm" className="text-[#92adc9] hover:text-white">
                    <FileDown className="size-4 mr-1" /> Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


