/**
 * Policy Rules API client for managing reimbursement policies.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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

export async function fetchPolicyRules(): Promise<PolicyRule[]> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/policy-rules`);
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

export async function createPolicyRule(data: CreateRuleInput): Promise<PolicyRule> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/policy-rules`, {
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

export async function updatePolicyRule(id: string, data: UpdateRuleInput): Promise<PolicyRule> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/policy-rules/${id}`, {
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

export async function deletePolicyRule(id: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/policy-rules/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete policy rule');
    }
}
