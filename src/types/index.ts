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
  isIssued: boolean; // Changed from hasStatement
  statementUrl?: string; // Optional property present in some places
  statementPeriod?: string; // Optional property present in mockData
  notes?: string; // Optional property present in mockData
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