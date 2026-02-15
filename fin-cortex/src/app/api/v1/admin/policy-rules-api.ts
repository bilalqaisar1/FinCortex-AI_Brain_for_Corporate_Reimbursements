import { BACKEND_URL } from '@/lib/config';

export interface PolicyRule {
    rule_id: string;
    rule_name: string;
    rule_type: 'max_claims_per_day' | 'max_amount' | 'monthly_limit' | 'restricted_keywords';
    rule_value: string;
    category_id?: string;
    description?: string;
    is_active: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    created_at?: string;
    updated_at?: string;
}

export interface RuleType {
    type: string;
    label: string;
    description: string;
    value_type: 'number' | 'text';
    example: string;
}

export interface CreateRuleInput {
    rule_name: string;
    rule_type: string;
    rule_value: string;
    category_id?: string;
    description?: string;
    is_active?: boolean;
    severity?: string;
}

export interface UpdateRuleInput {
    rule_name?: string;
    rule_type?: string;
    rule_value?: string;
    category_id?: string;
    description?: string;
    is_active?: boolean;
    severity?: string;
}

export async function fetchPolicyRules(adminId?: string): Promise<PolicyRule[]> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/policy-rules`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch policy rules');
    }
    const result = await response.json();
    return result.data || [];
}

export async function fetchRuleTypes(): Promise<RuleType[]> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/policy-rules/types`);
    if (!response.ok) {
        throw new Error('Failed to fetch rule types');
    }
    const result = await response.json();
    return result.data || [];
}

export async function createPolicyRule(data: CreateRuleInput, adminId?: string): Promise<PolicyRule> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/policy-rules`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create policy rule');
    }
    const result = await response.json();
    return result.data;
}

export async function updatePolicyRule(id: string, data: UpdateRuleInput, adminId?: string): Promise<PolicyRule> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/policy-rules/${id}`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update policy rule');
    }
    const result = await response.json();
    return result.data;
}

export async function deletePolicyRule(id: string, adminId?: string): Promise<void> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/policy-rules/${id}`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString(), {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete policy rule');
    }
}

export interface PolicyViolation {
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

export async function fetchViolations(adminId?: string): Promise<PolicyViolation[]> {
    const url = new URL(`${BACKEND_URL}/api/v1/admin/violations`);
    if (adminId) url.searchParams.append('admin_id', adminId);

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Failed to fetch violations');
    }
    const result = await response.json();
    return result.data || [];
}
