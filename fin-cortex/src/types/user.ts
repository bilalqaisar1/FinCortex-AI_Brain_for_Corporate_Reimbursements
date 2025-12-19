/**
 * User-related TypeScript types matching the database schema
 */

export interface Department {
    department_id: number | null;
    department_name: string | null;
}

export interface Admin {
    admin_id: string | null;
    full_name: string | null;
}

export interface Company {
    company_id: string | null;
    company_name: string | null;
}

export interface TeamMember {
    user_id: string;
    manager_id: string;
    department_id: number | null;
    full_name: string;
    employee_code: string | null;
    email: string;
    phone_number: string | null;
    role_id: number | null;
    status: string | null;
    created_at: string;
    updated_at: string | null;
    admin: Admin;
    company: Company;
    department: Department;
}

export interface TeamMembersResponse {
    success: boolean;
    data: {
        manager_id: string;
        users: TeamMember[];
        count: number;
    };
}
