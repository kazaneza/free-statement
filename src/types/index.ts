export interface Registrant {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  idNumber: string;
  branch: string;
  accountNumber: string;
  statementPeriod: string;
  registrationDate: string;
  statementUrl?: string;
  notes?: string;
  issuedBy: string;
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
  branchId: string;
  createdAt: string;
  active: boolean;
  displayName?: string;
}

export interface AccountVerification {
  accountNumber: string;
  hasReceivedFreeStatement: boolean;
  lastStatementDate?: string;
  accountDetails?: {
    fullName: string;
    branch: string;
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

export interface ADUser {
  username: string;
  displayName: string;
  email?: string;
  department?: string;
}