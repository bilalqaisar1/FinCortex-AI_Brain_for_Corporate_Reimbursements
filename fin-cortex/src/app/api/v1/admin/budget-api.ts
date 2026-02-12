// Use relative paths for Next.js API routes
const API_BASE = '/api/v1/admin/budgets';

export interface Budget {
    budget_id: string;
    company_id: string;
    company_name: string;
    department_name?: string; // New field
    total_amount: number;
    used_amount: number;
    remaining_amount: number;
    utilization_percentage: number;
    monthly_limit: number;
    monthly_used: number;
    status: 'healthy' | 'warning' | 'critical';
    currency: string;
    last_updated: string;
    category_id?: number;
    category_name?: string; // Legacy/Fallback
    department_id?: number;
    account_balance?: number;
    total_allocated?: number;
}

export interface CreateBudgetInput {
    company_id?: string;
    company_name?: string;
    admin_id?: string;
    total_amount: number;
    monthly_limit?: number;
    category_id?: number;
    department_id?: number; // New field
    currency?: string;
}

export interface UpdateBudgetInput {
    total_amount?: number;
    monthly_limit?: number;
    company_name?: string;
}

export interface BudgetsResponse {
    success: boolean;
    data: Budget[];
    account_balance: number;
    total_allocated: number;
    company_name: string;
}

export async function fetchBudgets(adminId?: string): Promise<BudgetsResponse> {
    const url = new URL(`${window.location.origin}${API_BASE}`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch budgets');
    }
    return await response.json();
}

export async function createBudget(data: CreateBudgetInput): Promise<Budget> {
    const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create budget');
    }
    const result = await response.json();
    return result.data;
}

export async function updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update budget');
    }
    const result = await response.json();
    return result.data;
}

export async function addFundsToBudget(budgetId: string, amount: number): Promise<any> {
    const response = await fetch(`${API_BASE}/${budgetId}/add-funds`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
        throw new Error('Failed to add funds');
    }
    return await response.json();
}

export async function topUpCompanyBalance(adminId: string, amount: number): Promise<any> {
    const response = await fetch(`${API_BASE}/top-up`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId, amount }),
    });
    if (!response.ok) {
        throw new Error('Failed to top up balance');
    }
    return await response.json();
}

export async function deleteBudget(id: string, adminId?: string): Promise<void> {
    const url = new URL(`${window.location.origin}${API_BASE}/${id}`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString(), {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete budget');
    }
}

export interface Category {
    category_id: number;
    category_name: string;
    description: string;
}

export async function fetchCategories(): Promise<Category[]> {
    const response = await fetch('/api/v1/admin/categories');
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    const result = await response.json();
    return result.data;
}

export interface Department {
    department_id: number;
    department_name: string;
}

export async function fetchDepartments(): Promise<Department[]> {
    const response = await fetch('/api/v1/admin/departments'); // We need to proxy this in Next.js too!
    if (!response.ok) {
        throw new Error('Failed to fetch departments');
    }
    const result = await response.json();
    return result.data;
}
