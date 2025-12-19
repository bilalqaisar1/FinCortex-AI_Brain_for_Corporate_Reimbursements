"use client";
import * as React from "react";
import { useState, useEffect } from "react";
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
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { useAuth } from "@/context/AuthContext";

export default function UserDashboardPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme, themeIcon } = useTheme();
  const { user, userProfile } = useAuth();

  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const roleLabel =
    userProfile?.roles?.role_name ||
    (userProfile?.userRole
      ? userProfile.userRole.charAt(0).toUpperCase() + userProfile.userRole.slice(1)
      : userProfile?.employee_code
        ? "Employee"
        : "Member");

  const employeeCode = userProfile?.employee_code || "N/A";
  const managerName = userProfile?.managers?.full_name || "Manager";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = React.useMemo(() => {
    const joinedDate = user?.created_at ? new Date(user.created_at) : null;
    if (!joinedDate || Number.isNaN(joinedDate.getTime())) return "—";
    return joinedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [user?.created_at]);

  const today = React.useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, []);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile menu toggle
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const mobileToggle = document.getElementById('mobileToggle');
      const navLinks = document.getElementById('navLinks');
      
      if (mobileToggle && navLinks && !mobileToggle.contains(target) && !navLinks.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);
  };
  const kpis = [
    {
      label: "Total Reimbursed (YTD)",
      value: "₹1,24,507.80",
      sub: "+5.2% vs last month",
      subClass: "text-emerald-400",
    },
    {
      label: "Allowed Reimbursement",
      value: "₹1,50,000.00",
      sub: "Remaining: ₹25,492.20",
      subClass: "text-muted-foreground",
    },
    {
      label: "Pending Claims",
      value: "3",
      sub: "1 claim requires attention",
      subClass: "text-amber-400",
    },
    {
      label: "Approval Rate",
      value: "92%",
      sub: "+0.8% vs last month",
      subClass: "text-emerald-400",
    },
  ];

  const claims = [
    { id: "#C-84621", category: "Travel", date: "2023-10-26", amount: "$450.00", status: { label: "Approved", color: "text-emerald-400/90", bg: "bg-emerald-400/10" } },
    { id: "#C-84620", category: "Meals", date: "2023-10-25", amount: "$85.50", status: { label: "Pending", color: "text-amber-400/90", bg: "bg-amber-400/10" } },
    { id: "#C-84619", category: "Software", date: "2023-10-24", amount: "$299.00", status: { label: "Approved", color: "text-emerald-400/90", bg: "bg-emerald-400/10" } },
    { id: "#C-84618", category: "Office Supplies", date: "2023-10-22", amount: "$120.75", status: { label: "Rejected", color: "text-red-500/90", bg: "bg-red-500/10" } },
    { id: "#C-84617", category: "Client Meals", date: "2023-10-21", amount: "$212.30", status: { label: "Approved", color: "text-emerald-400/90", bg: "bg-emerald-400/10" } },
  ];


  return (
    <RouteProtection allowedRoles={['user']}>
    <div className="flex min-h-[calc(100vh-0px)] w-full">
      {/* Navbar - Logo left, centered menu, theme toggle right */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="nav-container" style={{ justifyContent: 'space-between' }}>
          {/* Left side - Logo */}
          <Link href="/user/dashboard" className="logo">
            Fincortex
          </Link>

          {/* Center - Menu items */}
          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="navLinks" style={{ margin: '0 auto', gap: '2.5rem' }}>
            <li><Link href="/user/dashboard" onClick={handleLinkClick}>Dashboard</Link></li>
            <li><Link href="/user/claims/new" onClick={handleLinkClick}>Submit Claims</Link></li>
            <li><Link href="/user/claims/history" onClick={handleLinkClick}>Claim History</Link></li>
            <li><Link href="/user/profile" onClick={handleLinkClick}>Profile</Link></li>
          </ul>

          {/* Right side - Theme toggle and Mobile toggle */}
          <div className="flex items-center gap-4">
            <button className="theme-toggle" onClick={toggleTheme}>
              <div className="theme-icon">{themeIcon}</div>
            </button>
            <button 
              className={`mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
              id="mobileToggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex min-h-[100dvh] flex-1 flex-col pt-20">

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {/* Header Card */}
          <div className="card-hover glass-effect border-subtle mb-4 rounded-xl p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {userInitials}
                  </div>
                  <span className="text-base font-semibold text-primary">{displayName}</span>
                  <span
                    className="rounded-full border border-subtle px-3 py-1 text-xs font-semibold text-[#8b5cf6]"
                    style={{ background: "linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))" }}
                  >
                    {roleLabel ? roleLabel.toUpperCase() : "MEMBER"}
                  </span>
                  <span className="rounded-full border border-subtle px-3 py-1 text-xs font-semibold text-muted">
                    {employeeCode}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  Manager: {managerName} • Member since {memberSince}
                </p>
              </div>
              <div className="text-right text-sm text-muted">Today • {today}</div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 px-1 text-sm text-muted">
            <span>🏠</span>
            <span>Dashboard</span>
          </div>

          {/* KPI Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="glass-effect border-subtle hover-lift animate-fade-in-up">
                <CardContent className="animate-scale-in">
                  <p className="text-base font-medium leading-normal text-muted">{kpi.label}</p>
                  <p className="mt-1 text-3xl font-bold leading-tight tracking-tight text-primary">{kpi.value}</p>
                  <p className={`mt-1 text-sm font-medium leading-normal ${kpi.subClass}`}>{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Budget Progress */}
          <Card className="mb-8 glass-effect border-subtle">
            <CardHeader>
              <div>
                <CardTitle className="text-[18px] text-primary">📊 Monthly Budget Overview</CardTitle>
                <CardDescription>Track your spending limits by category</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Travel */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">✈️ Travel & Transportation</span>
                  <span className="text-sm font-bold text-primary">$450 / $1,000</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded bg-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: '45%' }} />
                </div>
                <div className="mt-1 text-xs text-muted">45% used • $550 remaining</div>
              </div>
              {/* Food */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">🍽️ Food & Beverage</span>
                  <span className="text-sm font-bold text-primary">$120 / $500</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded bg-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: '24%' }} />
                </div>
                <div className="mt-1 text-xs text-muted">24% used • $380 remaining</div>
              </div>
              {/* Office */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">📦 Office Supplies</span>
                  <span className="text-sm font-bold text-primary">$80 / $300</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded bg-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: '27%' }} />
                </div>
                <div className="mt-1 text-xs text-muted">27% used • $220 remaining</div>
              </div>
              {/* Accommodation */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">🏨 Accommodation</span>
                  <span className="text-sm font-bold text-primary">$600 / $800</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded bg-white/5">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: '75%' }} />
                </div>
                <div className="mt-1 text-xs font-medium text-amber-400">⚠️ 75% used • $200 remaining</div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Card */}
          <Card className="mb-8 glass-effect border-subtle animate-fade-in-up">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-[22px] tracking-[-0.015em] text-white">Reimbursement History</CardTitle>
                <CardDescription>Rupees vs Time</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-lg bg-[#233648] p-1">
                  <Button variant="ghost" className="h-7 px-3 text-xs text-[#92adc9] hover:text-white">3M</Button>
                  <Button variant="ghost" className="h-7 px-3 text-xs bg-[#324d67] text-white">6M</Button>
                  <Button variant="ghost" className="h-7 px-3 text-xs text-[#92adc9] hover:text-white">12M</Button>
                </div>
                <div className="hidden items-center gap-4 text-sm md:flex">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-white">Your Reimbursements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-3 bg-emerald-400" />
                    <span className="text-white">Company Average</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="animate-fade-in-up">
              <div className="relative h-72">
                <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-xs text-[#92adc9]">
                  <span>₹30k</span>
                  <span>₹22.5k</span>
                  <span>₹15k</span>
                  <span>₹7.5k</span>
                  <span>₹0</span>
                </div>
                <div className="absolute inset-0 grid grid-rows-5 pl-10">
                  <div className="border-b border-dashed border-white/10" />
                  <div className="border-b border-dashed border-white/10" />
                  <div className="border-b border-dashed border-white/10" />
                  <div className="border-b border-dashed border-white/10" />
                  <div />
                </div>
                <div className="absolute inset-0 flex items-end pl-10">
                  <svg className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="line-chart-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="url(#line-chart-gradient)"
                      points="0,150 100,120 200,180 300,100 400,130 500,80"
                      stroke="#137fec"
                      strokeWidth="2.5"
                      style={{ transform: "scaleX(calc(100% / 500)) scaleY(calc(100% / 288))", transformOrigin: "bottom left" }}
                    />
                    <polyline
                      fill="none"
                      points="0,140 100,140 200,140 300,140 400,140 500,140"
                      stroke="#50E3C2"
                      strokeDasharray="4 4"
                      strokeWidth="2"
                      style={{ transform: "scaleX(calc(100% / 500)) scaleY(calc(100% / 288))", transformOrigin: "bottom left" }}
                    />
                    {/* Dummy additional series */}
                    <polyline
                      fill="none"
                      points="0,160 100,110 200,130 300,90 400,110 500,70"
                      stroke="#8b5cf6"
                      strokeDasharray="6 6"
                      strokeWidth="2"
                      style={{ transform: "scaleX(calc(100% / 500)) scaleY(calc(100% / 288))", transformOrigin: "bottom left" }}
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-10 mt-2 px-2 text-xs text-[#92adc9]">
                <div className="flex justify-between">
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                </div>
              </div>
              <div className="ml-10 mt-4 px-2">
                <input className="range-lg h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#233648]" type="range" min={1} max={6} defaultValue={6} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Claims + Category Split */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Claims */}
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary">Recent Claims</h2>
              <Card className="overflow-hidden glass-effect border-subtle animate-fade-in-up">
                <Table>
                  <TableHeader className="bg-[#233648]/50 text-[#92adc9]">
                    <TableRow>
                      <TableHead className="px-6 py-3">Claim ID</TableHead>
                      <TableHead className="px-6 py-3">Category</TableHead>
                      <TableHead className="px-6 py-3">Date</TableHead>
                      <TableHead className="px-6 py-3 text-right">Amount</TableHead>
                      <TableHead className="px-6 py-3 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((c) => (
                      <TableRow key={c.id} className="border-[#324d67] hover:bg-[#233648]/30">
                        <TableCell className="px-6 py-4 font-medium text-primary">{c.id}</TableCell>
                        <TableCell className="px-6 py-4 text-muted">{c.category}</TableCell>
                        <TableCell className="px-6 py-4 text-muted">{c.date}</TableCell>
                        <TableCell className="px-6 py-4 text-right text-primary">{c.amount}</TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status.bg} ${c.status.color}`}>
                            {c.status.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Category Donut */}
            <div className="lg:col-span-1">
              <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary">Spending by Category</h2>
              <Card className="flex h-full flex-col items-center justify-center glass-effect border-subtle p-6 animate-fade-in-up">
                <div className="relative h-48 w-48">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F5A623" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#50E3C2" strokeDasharray="60, 100" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#137fec" strokeDasharray="35, 100" strokeWidth="4" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-muted">Total Spend</p>
                    <p className="text-2xl font-bold text-primary">$1,167.55</p>
                  </div>
                </div>
                <div className="mt-6 flex w-full flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#137fec]" />
                      <p className="text-primary">Travel</p>
                    </div>
                    <p className="font-medium text-muted">35%</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#50E3C2]" />
                      <p className="text-primary">Meals</p>
                    </div>
                    <p className="font-medium text-muted">25%</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#F5A623]" />
                      <p className="text-primary">Software & Supplies</p>
                    </div>
                    <p className="font-medium text-muted">40%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Approval vs Rejection + Metrics */}
          <div className="mt-8">
            <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Approval vs. Rejection Rate</div>
            <Card className="glass-effect border-subtle p-6">
              <div className="relative w-full" style={{ paddingTop: '40px', paddingBottom: '30px', paddingLeft: '50px', paddingRight: '15px' }}>
                <svg className="w-full" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: '280px' }}>
                  {/* Y-axis line */}
                  <line x1="50" y1="15" x2="50" y2="200" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                  {/* X-axis line */}
                  <line x1="50" y1="200" x2="550" y2="200" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                  
                  {/* Y-axis labels */}
                  <text x="42" y="25" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end" fontWeight="500">200</text>
                  <text x="42" y="65" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end" fontWeight="500">150</text>
                  <text x="42" y="105" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end" fontWeight="500">100</text>
                  <text x="42" y="145" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end" fontWeight="500">50</text>
                  <text x="42" y="195" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end" fontWeight="500">0</text>
                  
                  {/* Y-axis title */}
                  <text x="12" y="110" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600" textAnchor="middle" transform="rotate(-90 12 110)">Count</text>
                  
                  {/* X-axis labels */}
                  <text x="100" y="215" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="middle" fontWeight="500">Jan</text>
                  <text x="200" y="215" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="middle" fontWeight="500">Feb</text>
                  <text x="300" y="215" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="middle" fontWeight="500">Mar</text>
                  <text x="400" y="215" fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="middle" fontWeight="500">Apr</text>
                  
                  {/* X-axis title */}
                  <text x="300" y="230" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600" textAnchor="middle">Month</text>
                  
                  {/* Grid lines */}
                  <line x1="50" y1="65" x2="550" y2="65" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="50" y1="105" x2="550" y2="105" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="50" y1="145" x2="550" y2="145" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* Approved bars - scaled to fit compact view */}
                  <g fill="rgba(16,185,129,0.85)">
                    <rect x="80" y="50" width="40" height="150" rx="4" />
                    <rect x="180" y="35" width="40" height="165" rx="4" />
                    <rect x="280" y="65" width="40" height="135" rx="4" />
                    <rect x="380" y="25" width="40" height="175" rx="4" />
                  </g>
                  
                  {/* Rejected bars - scaled to fit compact view */}
                  <g fill="rgba(239,68,68,0.85)">
                    <rect x="120" y="135" width="40" height="65" rx="4" />
                    <rect x="220" y="125" width="40" height="75" rx="4" />
                    <rect x="320" y="145" width="40" height="55" rx="4" />
                    <rect x="420" y="120" width="40" height="80" rx="4" />
                  </g>
                  
                  {/* Legend */}
                  <g transform="translate(450, 30)">
                    <rect x="0" y="0" width="12" height="12" fill="rgba(16,185,129,0.8)" rx="2" />
                    <text x="18" y="10" fill="rgba(255,255,255,0.8)" fontSize="12">Approved</text>
                    <rect x="0" y="20" width="12" height="12" fill="rgba(239,68,68,0.8)" rx="2" />
                    <text x="18" y="30" fill="rgba(255,255,255,0.8)" fontSize="12">Rejected</text>
                  </g>
                </svg>
              </div>
            </Card>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-subtle p-5" style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.05))' }}>
                <div className="mb-2 text-xs font-semibold uppercase text-muted">Average Claim Amount</div>
                <div className="mb-1 text-2xl font-extrabold text-primary">$156</div>
                <div className="text-xs text-emerald-400">↑ 12% from last month</div>
              </div>
              <div className="rounded-xl border border-subtle p-5" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.05))' }}>
                <div className="mb-2 text-xs font-semibold uppercase text-muted">Fastest Approval</div>
                <div className="mb-1 text-2xl font-extrabold text-emerald-400">2.5 hrs</div>
                <div className="text-xs text-muted">Claim #1042</div>
              </div>
              <div className="rounded-xl border border-subtle p-5" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.05))' }}>
                <div className="mb-2 text-xs font-semibold uppercase text-muted">Slowest Approval</div>
                <div className="mb-1 text-2xl font-extrabold text-amber-400">5.2 days</div>
                <div className="text-xs text-muted">Claim #1015</div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
    </RouteProtection>
  );
}


