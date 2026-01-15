# 🧠 FinCortex - AI Brain for Corporate Reimbursements

<div align="center">

![FinCortex Logo](https://img.shields.io/badge/FinCortex-AI%20Powered-blue?style=for-the-badge&logo=brain&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)

**An intelligent, AI-powered corporate reimbursement management system that streamlines expense claims, automates policy enforcement, and provides real-time analytics for modern enterprises.**

[Problem Statement](#-problem-statement) • [Solution](#-our-solution) • [Features](#-features) • [User Roles](#-user-roles--workflows) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation)

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
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ❓ Problem Statement

Corporate expense reimbursement is a critical business process that often suffers from:

- **Manual Processing**: Paper-based receipts and manual data entry lead to errors and delays
- **Policy Violations**: Employees unknowingly submit claims that violate company policies
- **Approval Bottlenecks**: Managers struggle to review and approve claims efficiently
- **Lack of Visibility**: Finance teams have no real-time view of expense patterns and budget utilization
- **Fraud Risk**: Traditional systems fail to detect duplicate or fraudulent claims
- **Poor User Experience**: Employees face complex, time-consuming submission processes

---

## 💡 Our Solution

**FinCortex** is an end-to-end AI-powered reimbursement management platform that transforms how organizations handle expense claims:

### 🤖 Intelligent Automation
- **OCR Receipt Processing**: Upload a receipt photo, and our AI automatically extracts vendor, amount, date, and category
- **Smart Policy Engine**: Claims are automatically validated against configurable company policies before submission
- **Fraud Detection**: Machine learning algorithms flag suspicious patterns like duplicate receipts or unusual amounts

### 🚀 Streamlined Workflows
- **One-Click Approvals**: Managers can approve or reject claims directly from their dashboard
- **Real-time Notifications**: All stakeholders receive instant updates on claim status changes
- **Mobile-Friendly**: Submit and manage claims from any device

### 📊 Actionable Insights
- **Dynamic Dashboards**: Role-specific views with real-time KPIs and analytics
- **Budget Tracking**: Monitor spending against allocated budgets in real-time
- **Trend Analysis**: Identify spending patterns across departments, categories, and time periods

---

## 🌟 Key Features

### 1. Claim Management

| Feature | Description |
|---------|-------------|
| **Quick Submission** | Submit claims in under 30 seconds with receipt upload |
| **OCR Processing** | Automatic extraction of receipt data (amount, vendor, date) |
| **Category Assignment** | AI-suggested expense categories with manual override |
| **Status Tracking** | Real-time tracking from submission to reimbursement |
| **Claim History** | Complete historical view with search and filters |

### 2. Policy Engine

| Feature | Description |
|---------|-------------|
| **Max Amount Rules** | Set maximum allowed amounts per category |
| **Daily Claim Limits** | Restrict number of claims per user per day |
| **Monthly Budgets** | Enforce monthly spending limits by department |
| **Restricted Keywords** | Flag claims with specific keywords for review |
| **Auto-Enforcement** | Policies checked automatically before submission |

### 3. Budget Management

| Feature | Description |
|---------|-------------|
| **Company Budgets** | Allocate budgets at company level |
| **Real-time Utilization** | Track spending against budget in real-time |
| **Dynamic Calculations** | Used amounts calculated from approved claims |
| **Add Funds** | Admins can add funds to existing budgets |
| **Visual Progress** | Progress bars show budget utilization percentage |

### 4. Analytics & Reporting

| Feature | Description |
|---------|-------------|
| **Period Filtering** | View analytics for 7 days, 30 days, 90 days, or 1 year |
| **Status Breakdown** | Pie charts showing approved/pending/rejected ratios |
| **Category Analysis** | Identify top expense categories |
| **Department Insights** | Track spending by department |
| **Trend Comparisons** | Compare current period with previous periods |
| **Export Reports** | Download analytics data for external reporting |

### 5. Notifications

| Feature | Description |
|---------|-------------|
| **In-App Alerts** | Real-time notifications within the application |
| **Status Updates** | Notified when claims are approved/rejected |
| **Action Required** | Managers notified of pending approvals |
| **Read/Unread Tracking** | Mark notifications as read |

---

## 👥 User Roles & Workflows

### 🧑‍💼 Employee (User)

**Primary Functions:**
- Submit new reimbursement claims
- Upload receipt images for OCR processing
- Track claim status and history
- View personal spending analytics

**Workflow:**
```
1. Login → User Dashboard
2. Click "New Claim" → Fill expense details
3. Upload receipt → AI extracts data
4. Review & Submit → Claim sent to manager
5. Receive notification → Claim approved/rejected
6. View reimbursement status in history
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
- Review and approve/reject team claims
- Monitor team spending and patterns
- View team analytics and performance
- Manage team member claims

**Workflow:**
```
1. Login → Manager Dashboard
2. View Pending Claims section
3. Click claim → View details with receipt
4. Approve/Reject with optional comments
5. Employee receives notification
6. View team analytics for insights
```

**Dashboard Features:**
- Total Claims from team
- Pending Approvals count
- Total Amount processed
- Team Performance metrics
- Monthly Trend analysis
- Top Categories/Spenders

---

### 🏢 Administrator

**Primary Functions:**
- Manage company settings and budgets
- Create and configure policy rules
- Monitor organization-wide analytics
- Manage manager accounts
- Handle policy violations

**Workflow:**
```
1. Login → Admin Dashboard
2. View organization-wide KPIs
3. Manage Budgets → Add/Edit company budgets
4. Configure Policy Rules → Set limits and restrictions
5. Review Violations → Handle flagged claims
6. Analyze → Comprehensive reporting
```

**Dashboard Features:**
- Total Claims (this month)
- Pending Approvals organization-wide
- Budget Utilization percentage
- Policy Violations count
- Quick Analytics with period selection
- Claims Status Breakdown
- Top Category/Department insights

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js 15 Frontend (React 19)              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │  User   │  │ Manager │  │  Admin  │  │  Auth   │    │    │
│  │  │Dashboard│  │Dashboard│  │Dashboard│  │ Context │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 FastAPI Backend (Python)                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │Reimburse-│  │  Admin   │  │  Policy  │  │ Notifi- │ │    │
│  │  │  ments   │  │  Routes  │  │  Rules   │  │ cations │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │  Budget  │  │  Export  │  │  OCR     │  │  Fraud  │ │    │
│  │  │ Service  │  │ Service  │  │ Service  │  │Detection│ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Supabase (PostgreSQL)                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │  users   │  │ managers │  │companies │  │ budgets │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │reimburse-│  │ policy_  │  │ notifi-  │  │categories│ │    │
│  │  │  ments   │  │  rules   │  │ cations  │  │         │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │              Supabase Storage                    │   │    │
│  │  │         (Receipt Images & Documents)             │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
FinCortex-AI_Brain_for_Corporate_Reimbursements/
│
├── 📁 fin-cortex/                    # Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 app/                   # Next.js App Router
│   │   │   ├── 📁 admin/             # Admin pages
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── layout.tsx        # Admin layout wrapper
│   │   │   │   ├── 📁 analytics/     # Analytics page
│   │   │   │   ├── 📁 budget/        # Budget management
│   │   │   │   ├── 📁 policy-rules/  # Policy configuration
│   │   │   │   ├── 📁 users/         # Manager management
│   │   │   │   └── 📁 violations/    # Policy violations
│   │   │   │
│   │   │   ├── 📁 manager/           # Manager pages
│   │   │   │   ├── page.tsx          # Manager dashboard
│   │   │   │   ├── 📁 analytics/     # Team analytics
│   │   │   │   └── 📁 reimbursements/# Claim details
│   │   │   │
│   │   │   ├── 📁 user/              # Employee pages
│   │   │   │   ├── 📁 dashboard/     # User dashboard
│   │   │   │   ├── 📁 claims/        # Claim submission & history
│   │   │   │   └── 📁 profile/       # User profile
│   │   │   │
│   │   │   └── 📁 api/v1/            # API client functions
│   │   │       └── 📁 admin/         # Admin API clients
│   │   │
│   │   ├── 📁 components/            # Reusable Components
│   │   │   ├── 📁 dashboard/         # Dashboard components
│   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   ├── ManagerSidebar.tsx
│   │   │   │   ├── UserNavbar.tsx
│   │   │   │   ├── BudgetOverview.tsx
│   │   │   │   └── QuickAnalytics.tsx
│   │   │   └── 📁 ui/                # shadcn/ui components
│   │   │
│   │   ├── 📁 context/               # React Context
│   │   │   └── AuthContext.tsx       # Authentication state
│   │   │
│   │   └── 📁 lib/                   # Utilities
│   │       ├── supabase/             # Supabase client
│   │       └── utils.ts              # Helper functions
│   │
│   ├── package.json
│   └── next.config.ts
│
├── 📁 backend/                        # Backend Application
│   ├── 📁 app/
│   │   ├── main.py                   # FastAPI entry point
│   │   │
│   │   ├── 📁 api/
│   │   │   ├── 📁 routes/            # API Route Handlers
│   │   │   │   ├── reimbursement.py  # Claim CRUD & stats
│   │   │   │   ├── admin.py          # Admin stats & analytics
│   │   │   │   ├── budget.py         # Budget management
│   │   │   │   ├── policy_rules.py   # Policy CRUD
│   │   │   │   ├── notification.py   # Notifications
│   │   │   │   └── export.py         # Report exports
│   │   │   └── 📁 v1/
│   │   │       └── router.py         # Route aggregation
│   │   │
│   │   ├── 📁 services/              # Business Logic
│   │   │   ├── reimbursement_service.py
│   │   │   ├── policy_service.py
│   │   │   ├── fraud_detection_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── notification_service.py
│   │   │   └── supabase_service.py
│   │   │
│   │   └── 📁 models/                # Pydantic Models
│   │
│   ├── 📁 scripts/                   # Utility Scripts
│   ├── 📁 tests/                     # Test Suites
│   ├── requirements.txt
│   └── .env
│
└── README.md                          # This file
```

---

## 🗄 Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Employee accounts | user_id, full_name, email, role, manager_id, admin_id |
| `managers` | Manager accounts | manager_id, full_name, email, admin_id |
| `companies` | Company information | company_id, company_name, admin_id |
| `reimbursements` | Expense claims | reimbursement_id, user_id, amount_claimed, status, category_id |
| `company_budgets` | Budget allocations | budget_id, company_id, total_balance, last_updated |
| `reimbursement_rules` | Policy rules | rule_id, category_id, max_amount, monthly_limit |
| `notifications` | User notifications | notification_id, user_id, message, read_status |
| `expense_categories` | Expense categories | category_id, category_name |
| `departments` | Company departments | department_id, department_name |

### Entity Relationships

```
companies (1) ──────< (n) managers
companies (1) ──────< (n) company_budgets
managers (1) ─────<── (n) users
users (1) ──────────< (n) reimbursements
reimbursements (n) ──> (1) expense_categories
reimbursements (n) ──> (1) departments
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5 | React framework with App Router |
| **React** | 19.1 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Radix UI** | Latest | Accessible UI primitives |
| **Lucide React** | Latest | Icon library |
| **Supabase JS** | 2.58 | Database & auth client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115+ | Modern Python web framework |
| **Uvicorn** | 0.30+ | ASGI server |
| **Pydantic** | 2.9+ | Data validation |
| **Supabase** | 2.5+ | Database client |
| **OpenAI** | 1.51+ | AI/ML services |
| **Pillow** | 10.4+ | Image processing |
| **HTTPX** | 0.27+ | Async HTTP client |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, authentication, storage |
| **Vercel** (recommended) | Frontend deployment |
| **Railway/Render** (recommended) | Backend deployment |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Python** 3.11 or higher ([Download](https://python.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com/))
- **Supabase** account ([Sign up](https://supabase.com/))

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
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp env_template.txt .env
```

Edit `backend/.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for OCR and AI features)
OPENAI_API_KEY=sk-your-openai-key

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd fin-cortex

# Install Node.js dependencies
npm install

# Create environment file
touch .env.local
```

Edit `fin-cortex/.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Step 5: Initialize Database

Run the database schema setup in your Supabase SQL editor. The schema includes tables for users, managers, companies, reimbursements, budgets, policy rules, and more.

### Step 6: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Start Frontend:**
```bash
cd fin-cortex
npm run dev
```

### Step 7: Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## 📚 API Documentation

### Authentication

All API requests should include the user context. The frontend handles this through Supabase Auth.

### Reimbursements API

#### Submit a New Claim
```http
POST /api/v1/reimbursements/submit
Content-Type: multipart/form-data

{
  "user_id": "uuid",
  "category_id": "uuid",
  "amount": 5000,
  "description": "Client meeting lunch",
  "receipt_image": <file>
}
```

#### Get User Claims
```http
GET /api/v1/reimbursements/user/{user_id}
```

#### Get Manager's Team Claims
```http
GET /api/v1/reimbursements/manager/{manager_id}
```

#### Update Claim Status
```http
PUT /api/v1/reimbursements/{reimbursement_id}/status
Content-Type: application/json

{
  "status": "approved",
  "manager_comments": "Approved for client meeting"
}
```

### Admin API

#### Get Dashboard Stats
```http
GET /api/v1/admin/stats?admin_id={admin_id}
```

**Response:**
```json
{
  "success": true,
  "company_name": "Your Company",
  "data": {
    "total_claims": { "value": 150, "change": "+12%" },
    "pending_approvals": { "value": 23, "change": "5 new" },
    "budget_utilization": { "value": 67, "change": "+5%" },
    "policy_violations": { "value": 3, "change": "1 resolved" }
  }
}
```

#### Get Analytics
```http
GET /api/v1/admin/analytics?admin_id={admin_id}&period=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "Last 30 days",
    "totalClaims": 245,
    "totalAmount": 1250000,
    "averageClaim": 5102.04,
    "approvedClaims": 180,
    "pendingClaims": 45,
    "rejectedClaims": 20,
    "topCategory": "Travel",
    "topDepartment": "Engineering",
    "monthlyTrend": 15.5,
    "weeklyTrend": -2.3,
    "activeUsers": 67
  }
}
```

### Budget API

#### Get All Budgets
```http
GET /api/v1/admin/budgets
```

#### Create Budget
```http
POST /api/v1/admin/budgets
Content-Type: application/json

{
  "company_id": "uuid",
  "company_name": "Tech Corp",
  "total_amount": 5000000
}
```

#### Add Funds
```http
POST /api/v1/admin/budgets/{budget_id}/add-funds
Content-Type: application/json

{
  "amount": 500000,
  "notes": "Q2 budget increase"
}
```

### Policy Rules API

#### Get Policy Rules
```http
GET /api/v1/policy-rules?company_id={company_id}
```

#### Create Policy Rule
```http
POST /api/v1/policy-rules
Content-Type: application/json

{
  "company_id": "uuid",
  "rule_type": "max_amount",
  "rule_value": 50000,
  "category_id": "uuid",
  "description": "Max travel expense per claim"
}
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **Authorization** | Role-based access control (User/Manager/Admin) |
| **Row Level Security** | Supabase RLS policies on all tables |
| **API Protection** | Service role keys for backend operations |
| **Input Validation** | Pydantic models for all API inputs |
| **CORS** | Configured for specific origins only |

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/)
3. Set environment variables
4. Deploy

### Backend (Railway/Render)

1. Create new web service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

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

- **Frontend**: ESLint + Prettier
- **Backend**: PEP 8 + Black formatter

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Bilal Qaisar**

- 🐙 GitHub: [@bilalqaisar1](https://github.com/bilalqaisar1)
- 💼 LinkedIn: [Bilal Qaisar](https://linkedin.com/in/bilalqaisar)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance Python framework
- [Supabase](https://supabase.com/) for the backend-as-a-service platform
- [Radix UI](https://radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ for smarter corporate expense management**

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)

</div>
