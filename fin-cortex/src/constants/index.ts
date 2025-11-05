// Application constants

export const REIMBURSEMENT_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'training', label: 'Training' },
  { value: 'software', label: 'Software' },
  { value: 'other', label: 'Other' },
] as const;

export const REIMBURSEMENT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'submitted', label: 'Submitted', color: 'blue' },
  { value: 'under_review', label: 'Under Review', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'paid', label: 'Paid', color: 'purple' },
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  REIMBURSEMENTS: '/reimbursements',
  NEW_REIMBURSEMENT: '/reimbursements/new',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;
