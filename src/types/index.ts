export interface Registrant {
  id: string;
  accountNumber: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  idNumber?: string;
  registrationDate: string;
  hasStatement: number; // 0 = no statement, 1 = has statement
  issuedBy: string;
  branch: string;
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