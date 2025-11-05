// Common types for the reimburse system

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reimbursement {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: ReimbursementCategory;
  status: ReimbursementStatus;
  submittedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  attachments: string[];
  notes?: string;
}

export type ReimbursementCategory = 
  | 'travel'
  | 'meals'
  | 'office_supplies'
  | 'training'
  | 'software'
  | 'other';

export type ReimbursementStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface ReimbursementFormData {
  amount: number;
  description: string;
  category: ReimbursementCategory;
  attachments: File[];
  notes?: string;
}
