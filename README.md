# 🧠 FinCortex — AI Brain for Corporate Reimbursements

<div align="center">

![FinCortex Logo](https://img.shields.io/badge/FinCortex-AI%20Powered-blue?style=for-the-badge&logo=brain&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-Document%20AI-0078D4?style=for-the-badge&logo=microsoftazure)

**An intelligent, AI-powered corporate reimbursement management system that streamlines expense claims, automates policy enforcement, and provides real-time analytics for modern enterprises.**

[Problem Statement](#-problem-statement) • [Solution](#-our-solution) • [Features](#-key-features) • [User Roles](#-user-roles--workflows) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Deployment](#-server-deployment) • [API Docs](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [User Roles & Workflows](#-user-roles--workflows)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Server Deployment](#-server-deployment)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Contributing](#-contributing)

---

## ❓ Problem Statement

Corporate expense reimbursement is a critical business process that often suffers from:

- **Manual Processing** — Paper-based receipts and manual data entry lead to errors and delays
- **Policy Violations** — Employees unknowingly submit claims that violate company policies
- **Approval Bottlenecks** — Managers struggle to review and approve claims efficiently
- **Lack of Visibility** — Finance teams have no real-time view of expense patterns and budget utilization
- **Fraud Risk** — Traditional systems fail to detect duplicate or fraudulent claims
- **Poor User Experience** — Employees face complex, time-consuming submission processes

---

## 💡 Our Solution

**FinCortex** is an end-to-end AI-powered reimbursement management platform that transforms how organizations handle expense claims.

### 🤖 Intelligent Automation
- **Dual OCR Engine** — Azure Document Intelligence (primary) with OpenAI Vision fallback for reliable receipt processing
- **GPT-Powered Structuring** — Extracts vendor, amount, date, individual items with per-item categorization, and identifies non-reimbursable items (alcohol, tobacco, etc.)
- **Smart Policy Engine** — Claims are automatically validated against configurable company policies before submission
- **Fraud Detection** — Algorithms flag suspicious patterns like duplicate receipts, unusual amounts, or velocity checks

### 🚀 Streamlined Workflows
- **One-Click Approvals** — Managers approve/reject claims directly from their dashboard
- **Real-time Notifications** — All stakeholders receive instant in-app alerts on claim status changes
- **Itemized Breakdown** — Items are auto-grouped into reimbursable vs. non-reimbursable with per-item category badges
- **Invoice Generation** — Post-submission invoice page with PDF download for record-keeping

### 📊 Actionable Insights
- **Dynamic Dashboards** — Role-specific views with real-time KPIs and analytics
- **Budget Tracking** — Monitor spending against allocated budgets by company, department, and category
- **Trend Analysis** — Period-based analytics (7d, 30d, 90d, 1y) with spending patterns across departments and categories
- **Data Export** — Download reports in CSV/Excel for external reporting

---

## 🌟 Key Features

### 1. AI-Powered Receipt Processing

| Feature | Description |
|---------|-------------|
| **Azure Document Intelligence** | Primary OCR engine using Microsoft's `prebuilt-layout` model for high-accuracy text extraction |
| **OpenAI Vision Fallback** | Automatic fallback to GPT-4o Vision if Azure fails or is unconfigured |
| **GPT Text Structuring** | Converts raw OCR text into structured JSON — vendor, date, items, amounts, categories |
| **Per-Item Categorization** | Each item gets its own expense category, subcategory, and reimbursable flag |
| **Non-Reimbursable Detection** | AI flags items like alcohol, tobacco, personal entertainment as non-reimbursable |
| **Smart Price Correction** | Detects and fixes OCR errors like missing decimals or extra zeros |

### 2. Expense Claim Management

| Feature | Description |
|---------|-------------|
| **Quick Submission** | Upload receipt → AI auto-fills everything → review → submit in under 30 seconds |
| **Itemized Breakdown** | Visual grouping of reimbursable (green) and non-reimbursable (red, strikethrough) items |
| **Reimbursable Total** | Calculated total excluding non-reimbursable items (displayed in PKR) |
| **Category Badges** | Per-item category and subcategory badges for clear cost tracking |
| **Invoice Page** | Post-submission invoice with full employee, organization, and expense details |
| **PDF Download** | Print-optimized invoice for downloading as PDF |
| **Claim History** | Searchable, filterable history with status tracking |

### 3. Policy Engine

| Feature | Description |
|---------|-------------|
| **Max Amount Rules** | Set maximum allowed amounts per category |
| **Daily Claim Limits** | Restrict number of claims per user per day |
| **Monthly Budgets** | Enforce monthly spending limits by department |
| **Restricted Keywords** | Flag claims with specific keywords for review |
| **Auto-Enforcement** | Policies checked automatically before submission with violation flags |

### 4. Budget Management

| Feature | Description |
|---------|-------------|
| **Company-Level Budgets** | Allocate budgets at company, department, and category levels |
| **Real-time Utilization** | Track spending against budget with dynamic progress bars |
| **Add Funds / Top-Up** | Admins can add funds to existing budgets |
| **Category Budgets** | Per-category budget allocation and tracking |
| **Department Scoping** | Optional department-specific budget constraints |

### 5. Analytics & Reporting

| Feature | Description |
|---------|-------------|
| **Period Filtering** | Analytics for 7 days, 30 days, 90 days, or 1 year |
| **Status Breakdown** | Pie charts showing approved/pending/rejected ratios |
| **Category Analysis** | Top expense categories with amount breakdowns |
| **Department Insights** | Spending distribution by department |
| **Trend Comparisons** | Monthly and weekly trend percentages |
| **Data Export** | CSV/Excel export for external reporting |

### 6. Notifications & Alerts

| Feature | Description |
|---------|-------------|
| **In-App Notifications** | Real-time notification center with unread count badge |
| **Status Updates** | Instant alerts when claims are approved/rejected |
| **Action Required** | Managers notified of pending approvals |
| **Email Notifications** | Automated email alerts for critical actions |
| **Read/Unread Tracking** | Mark as read with visual indicators |

---

## 👥 User Roles & Workflows

### 🧑‍💼 Employee (User)

**Primary Functions:**
- Submit new reimbursement claims
- Upload receipt images for AI-powered OCR processing
- Review auto-filled itemized breakdown with category assignments
- Track claim status and history
- Download post-submission invoices as PDF

**Workflow:**
```
1. Login → User Dashboard
2. Click "New Claim" → Select receipt/vendor type
3. Upload receipt → AI extracts and categorizes all items
4. Review items → Reimbursable vs Non-Reimbursable grouped
5. Verify details & Submit → Redirected to Invoice page
6. Download/Print Invoice → Back to dashboard
7. Receive notification → Claim approved/rejected
```

**Dashboard Features:**
- Total Reimbursed (YTD)
- Pending Claims count
- Approval Rate percentage
- Spending by category (donut chart)
- Recent claims list with status

---

### 👔 Manager

**Primary Functions:**
- Review and approve/reject team claims with one click
- View claim details with receipt images
- Monitor team spending and patterns
- View team analytics and performance

**Workflow:**
```
1. Login → Manager Dashboard
2. View "Pending Claims" section
3. Click claim → View full details with receipt
4. Approve/Reject with optional comments
5. Employee receives instant notification
6. View team analytics for insights
```

**Dashboard Features:**
- Total Claims from team
- Pending Approvals count
- Total Amount processed
- Team Performance metrics
- Monthly Trend analysis
- Top Categories / Spenders
- Team Budget overview

---

### 🏢 Administrator

**Primary Functions:**
- Manage company settings and budgets
- Create and configure policy rules
- Monitor organization-wide analytics
- Manage manager accounts and departments
- Handle policy violations and flagged claims

**Workflow:**
```
1. Login → Admin Dashboard
2. View organization-wide KPIs
3. Manage Budgets → Add/Edit company and category budgets
4. Configure Policy Rules → Set limits and restrictions
5. Review Violations → Handle flagged claims
6. Analyze → Comprehensive reporting with export
```

**Dashboard Features:**
- Total Claims (this month)
- Pending Approvals organization-wide
- Budget Utilization percentage
- Policy Violations count
- Quick Analytics with period selection
- Claims Status Breakdown
- Top Category / Department insights

---

## 🏗 System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                Next.js 15 Frontend (React 19)                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │   User   │  │ Manager  │  │  Admin   │  │   Auth       │  │   │
│  │  │Dashboard │  │Dashboard │  │Dashboard │  │  Context     │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ Expense  │  │ Invoice  │  │ Notifi-  │  │  Budget /    │  │   │
│  │  │  Form    │  │  Page    │  │ cations  │  │  Analytics   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                   │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                  FastAPI Backend (Python)                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │Reimburse │  │  Admin   │  │  Budget  │  │   Policy     │  │   │
│  │  │  ments   │  │  Routes  │  │  Routes  │  │   Rules      │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ Receipt  │  │   GPT    │  │  Fraud   │  │   Email      │  │   │
│  │  │Processing│  │ Service  │  │Detection │  │  Service     │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       AI / OCR LAYER                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐  │
│  │  Azure Document        │  │   OpenAI GPT-4o                   │  │
│  │  Intelligence (Primary)│  │   Text Structuring + Vision       │  │
│  │  prebuilt-layout model │  │   Fallback OCR                    │  │
│  └────────────────────────┘  └────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                  Supabase (PostgreSQL)                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │  users   │  │companies │  │reimburse │  │   budgets    │  │   │
│  │  └──────────┘  └──────────┘  │  ments   │  └──────────────┘  │   │
│  │  ┌──────────┐  ┌──────────┐  └──────────┘  ┌──────────────┐  │   │
│  │  │ managers │  │policy_   │  ┌──────────┐  │  categories  │  │   │
│  │  │          │  │  rules   │  │notifica- │  │  departments │  │   │
│  │  └──────────┘  └──────────┘  │  tions   │  └──────────────┘  │   │
│  │                              └──────────┘                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │           Supabase Storage (Receipt Images)              │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
FinCortex-AI_Brain_for_Corporate_Reimbursements/
│
├── 📁 fin-cortex/                         # Frontend (Next.js 15)
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 admin/                 # Admin dashboard & pages
│   │   │   │   ├── page.tsx              # Dashboard with KPIs
│   │   │   │   ├── 📁 analytics/         # Organization analytics
│   │   │   │   ├── 📁 budget/            # Budget management
│   │   │   │   ├── 📁 policy-rules/      # Policy configuration
│   │   │   │   ├── 📁 users/             # Manager management
│   │   │   │   └── 📁 violations/        # Policy violations
│   │   │   │
│   │   │   ├── 📁 manager/               # Manager dashboard & pages
│   │   │   │   ├── page.tsx              # Dashboard with team claims
│   │   │   │   ├── 📁 analytics/         # Team analytics
│   │   │   │   ├── 📁 approvals/         # Approval management
│   │   │   │   ├── 📁 budget/            # Team budget view
│   │   │   │   ├── 📁 reimbursements/    # Claim details & view
│   │   │   │   └── 📁 users/             # Team member management
│   │   │   │
│   │   │   ├── 📁 user/                  # Employee pages
│   │   │   │   ├── 📁 dashboard/         # User dashboard
│   │   │   │   ├── 📁 claims/
│   │   │   │   │   ├── 📁 new/           # Submit new claim (ExpenseForm)
│   │   │   │   │   ├── 📁 history/       # Claim history
│   │   │   │   │   └── 📁 invoice/[id]/  # Post-submission invoice
│   │   │   │   └── 📁 profile/           # User profile
│   │   │   │
│   │   │   ├── 📁 api/v1/               # Next.js API route handlers
│   │   │   ├── 📁 components/forms/      # ExpenseForm component
│   │   │   ├── 📁 login/                # Login page
│   │   │   ├── 📁 signup/               # Registration page
│   │   │   └── 📁 forgot-password/      # Password reset flow
│   │   │
│   │   ├── 📁 components/               # Shared components
│   │   │   ├── 📁 dashboard/            # 19 dashboard components
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   ├── ManagerSidebar.tsx / ManagerLayout.tsx
│   │   │   │   ├── UserNavbar.tsx
│   │   │   │   ├── BudgetOverview.tsx
│   │   │   │   ├── QuickAnalytics.tsx
│   │   │   │   ├── PolicyViolations.tsx
│   │   │   │   ├── PendingApprovals.tsx
│   │   │   │   ├── UserManagement.tsx
│   │   │   │   ├── Charts.tsx / DataTable.tsx
│   │   │   │   └── StatsCard.tsx / FilterPanel.tsx
│   │   │   ├── 📁 ui/                   # 25 shadcn/ui components
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── LogoLoop.tsx / TypeWriter.tsx
│   │   │
│   │   ├── 📁 context/
│   │   │   └── AuthContext.tsx           # Auth state & user profile
│   │   ├── 📁 hooks/
│   │   │   └── useTheme.ts              # Dark/light theme toggle
│   │   └── 📁 lib/
│   │       └── supabase/                 # Supabase client setup
│   │
│   ├── package.json
│   └── next.config.ts
│
├── 📁 backend/                            # Backend (FastAPI + Python)
│   ├── 📁 app/
│   │   ├── main.py                       # FastAPI entry point
│   │   │
│   │   ├── 📁 api/routes/                # 12 API Route Handlers
│   │   │   ├── reimbursement.py          # Claim CRUD, stats, history
│   │   │   ├── admin.py                  # Admin stats & analytics
│   │   │   ├── budget.py                 # Budget CRUD & top-up
│   │   │   ├── policy_rules.py           # Policy rule CRUD
│   │   │   ├── receipt.py                # Receipt upload & OCR
│   │   │   ├── category.py              # Expense categories
│   │   │   ├── notification.py          # In-app notifications
│   │   │   ├── export.py                # CSV/Excel report export
│   │   │   ├── receipt_code.py          # Receipt code generation
│   │   │   ├── remote_receipt.py        # Remote receipt handling
│   │   │   └── rpc.py                   # Supabase RPC endpoints
│   │   │
│   │   ├── 📁 services/                  # 16 Business Logic Services
│   │   │   ├── receipt_processing_service.py  # OCR orchestration (Azure → OpenAI fallback)
│   │   │   ├── azure_document_intelligence_service.py  # Azure OCR
│   │   │   ├── vision_service.py              # OpenAI Vision OCR
│   │   │   ├── gpt_service.py                 # GPT text structuring with per-item categories
│   │   │   ├── reimbursement_service.py       # Claim business logic
│   │   │   ├── policy_service.py              # Policy enforcement
│   │   │   ├── fraud_detection_service.py     # Fraud detection algorithms
│   │   │   ├── email_service.py               # Email notifications
│   │   │   ├── image_compression_service.py   # Image optimization
│   │   │   ├── storage_service.py             # File storage
│   │   │   ├── supabase_service.py            # Database client
│   │   │   └── supabase_rpc_service.py        # RPC function calls
│   │   │
│   │   ├── 📁 models/                    # Pydantic data models
│   │   └── 📁 config/                    # Settings & database config
│   │
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 🗄 Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Employee accounts | user_id, full_name, email, role, manager_id, company_id, employee_code |
| `managers` | Manager accounts | manager_id, full_name, email, admin_id |
| `companies` | Company information | company_id, company_name, admin_id, account_balance |
| `departments` | Company departments | department_id, department_name, company_id |
| `reimbursements` | Expense claims | reimbursement_id, user_id, amount_claimed, status, category_id, flags (JSONB) |
| `company_budgets` | Budget allocations | budget_id, company_id, total_balance, department_id, category_id |
| `reimbursement_rules` | Policy rules | rule_id, company_id, category_id, max_amount, monthly_limit |
| `notifications` | User notifications | notification_id, user_id, message, read_status |
| `expense_categories` | Expense categories | category_id, category_name, company_id |
| `expense_subcategories` | Sub-categories | subcategory_id, subcategory_name, category_id |

### Entity Relationships

```
companies (1) ──────< (n) managers
companies (1) ──────< (n) departments
companies (1) ──────< (n) company_budgets
companies (1) ──────< (n) expense_categories
companies (1) ──────< (n) reimbursement_rules
managers  (1) ──────< (n) users
users     (1) ──────< (n) reimbursements
users     (1) ──────< (n) notifications
reimbursements (n) ──> (1) expense_categories
reimbursements (n) ──> (1) departments
expense_categories (1) ──< (n) expense_subcategories
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5 | React framework with App Router & Turbopack |
| **React** | 19.1 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Radix UI** | Latest | Accessible UI primitives (Dialog, Select, Tabs, etc.) |
| **Lucide React** | 0.544+ | Modern icon library |
| **Supabase JS** | 2.58+ | Database & auth client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115+ | Modern Python web framework |
| **Uvicorn** | 0.30+ | ASGI server |
| **Pydantic** | 2.9+ | Data validation & settings |
| **Supabase Python** | 2.5+ | Database client |
| **OpenAI** | 1.51+ | GPT text structuring & Vision OCR |
| **Azure Document Intelligence** | 1.0+ | Primary OCR engine |
| **Pillow** | 10.4+ | Image processing & compression |
| **HTTPX** | 0.27+ | Async HTTP client |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, authentication, row-level security, file storage |
| **Azure AI** | Document Intelligence for OCR text extraction |
| **OpenAI** | GPT-4o for text structuring and Vision-based OCR fallback |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Python** 3.11 or higher ([Download](https://python.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase** account ([Sign up](https://supabase.com/))
- **OpenAI** API key ([Get key](https://platform.openai.com/))
- **Azure AI** Document Intelligence resource (optional, for primary OCR)

### Step 1: Clone the Repository

```bash
git clone https://github.com/bilalqaisar1/FinCortex-AI_Brain_for_Corporate_Reimbursements.git
cd FinCortex-AI_Brain_for_Corporate_Reimbursements
```

### Step 2: Set Up Supabase

1. Create a new project at [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Settings** → **API** to get your credentials
3. Note down:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (required for GPT text structuring)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o

# Azure Document Intelligence (optional — falls back to OpenAI Vision if not set)
AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_KEY=your-azure-key

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### Step 4: Frontend Setup

```bash
# Navigate to frontend (from project root)
cd fin-cortex

# Install dependencies
npm install
```

Create `fin-cortex/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Step 5: Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd fin-cortex
npm run dev
```

### Step 6: Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## 🖥 Server Deployment

### Step 1: Push Code to GitHub

```bash
cd FinCortex-AI_Brain_for_Corporate_Reimbursements
git add -A
git commit -m "deploy: latest changes"
git push origin main
```

### Step 2: Clone on Server

```bash
git clone https://github.com/bilalqaisar1/FinCortex-AI_Brain_for_Corporate_Reimbursements.git
cd FinCortex-AI_Brain_for_Corporate_Reimbursements
```

### Step 3: Setup & Run Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with your credentials
nano .env

# Run (accessible from any IP)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run in background (persists after SSH disconnect)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### Step 4: Setup & Run Frontend

```bash
cd ../fin-cortex
npm install

# Create .env.local — point NEXT_PUBLIC_BACKEND_URL to your server IP
nano .env.local

# Build for production
npm run build

# Run on 0.0.0.0 (accessible from any IP)
npm run start -- -H 0.0.0.0 -p 3000

# Run in background
nohup npm run start -- -H 0.0.0.0 -p 3000 > frontend.log 2>&1 &
```

### Step 5: Open Firewall Ports

```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 8000

# For cloud servers (AWS/GCP/Azure): open ports 3000 & 8000 in Security Group / Firewall Rules
```

### Step 6: Access

- **Frontend:** `http://YOUR_SERVER_IP:3000`
- **Backend API:** `http://YOUR_SERVER_IP:8000/docs`

---

## 📚 API Documentation

### Reimbursements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reimbursements/submit` | Submit a new claim |
| `GET` | `/api/v1/reimbursements/user/{user_id}` | Get user's claims |
| `GET` | `/api/v1/reimbursements/manager/{manager_id}` | Get manager's team claims |
| `PUT` | `/api/v1/reimbursements/{id}/status` | Approve/reject a claim |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/stats?admin_id={id}` | Dashboard KPIs |
| `GET` | `/api/v1/admin/analytics?admin_id={id}&period=30d` | Organization analytics |
| `GET` | `/api/v1/admin/violations?admin_id={id}` | Policy violations |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/budgets` | List all budgets |
| `POST` | `/api/v1/admin/budgets` | Create a budget |
| `PUT` | `/api/v1/admin/budgets/{id}` | Update a budget |
| `POST` | `/api/v1/admin/budgets/{id}/add-funds` | Top up a budget |

### Policy Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/policy-rules?company_id={id}` | List rules |
| `POST` | `/api/v1/policy-rules` | Create a rule |
| `PUT` | `/api/v1/policy-rules/{id}` | Update a rule |
| `DELETE` | `/api/v1/policy-rules/{id}` | Delete a rule |

### Receipt Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/receipts/upload` | Upload & OCR a receipt |
| `POST` | `/api/v1/receipts/process` | Process receipt text with GPT |

### Categories & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/categories?company_id={id}` | List categories & subcategories |
| `GET` | `/api/v1/notifications/{user_id}` | Get user notifications |
| `PUT` | `/api/v1/notifications/{id}/read` | Mark as read |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/export/claims?admin_id={id}&format=csv` | Export claims data |

> 📖 Full interactive API documentation available at `/docs` (Swagger UI) when the backend is running.

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **Authorization** | Role-based access control (User / Manager / Admin) |
| **Row Level Security** | Supabase RLS policies on all tables |
| **API Protection** | Service role keys for backend operations |
| **Input Validation** | Pydantic models for all API inputs |
| **CORS** | Configured for specific allowed origins |
| **Middleware Protection** | Next.js middleware for route guarding |
| **Policy Enforcement** | Automated pre-submission policy checks |
| **Fraud Detection** | Duplicate receipt detection, velocity checks, amount anomalies |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Code Style

- **Frontend:** ESLint + Prettier
- **Backend:** PEP 8 + Black formatter

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Bilal Qaisar**

- 🐙 GitHub: [@bilalqaisar1](https://github.com/bilalqaisar1)
- 💼 LinkedIn: [Bilal Qaisar](https://linkedin.com/in/bilalqaisar)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — React framework with App Router
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python framework
- [Supabase](https://supabase.com/) — Backend-as-a-service platform
- [Azure AI Document Intelligence](https://azure.microsoft.com/en-us/products/ai-services/ai-document-intelligence) — Enterprise OCR
- [OpenAI](https://openai.com/) — GPT-4o for text structuring
- [Radix UI](https://radix-ui.com/) — Accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Lucide](https://lucide.dev/) — Beautiful icon library

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ for smarter corporate expense management**

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)

</div>
