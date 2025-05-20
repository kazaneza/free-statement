export interface Registrant {
  id: string;
  accountNumber: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  idNumber?: string;
  registrationDate: string;
  issuedBy: string;
  branch: string;
  hasStatement: number; // 0 = no statement, 1 = has statement
  statementUrl?: string; // URL to download the statement
  statementPeriod?: string; // e.g. "3 months"
  notes?: string; // Additional notes
}

export interface AccountVerification {
  accountNumber: string;
  isRegistered: boolean;
  registrationDate?: string;
  accountDetails?: {
    fullName: string;
    phoneNumber: string;
  };
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'issuer';
  branch: string;
}

export interface DashboardStats {
  total_registrations: number;
  todays_registrations: number;
  branch_stats: Array<{ branch: string; count: number }>;
}

export interface ADUser {
  username: string;
  displayName: string;
  email?: string;
  department?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Issuer {
  id: string;
  name: string;
  branch_id: string;
  created_at: string;
  active: boolean;
}

export interface BranchCreate {
  code: string;
  name: string;
}

export interface BranchResponse extends Branch {}

export interface IssuerCreate {
  name: string;
  branch_id: string;
}

export interface IssuerResponse extends Issuer {}