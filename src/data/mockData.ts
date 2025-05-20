import { Registrant } from '../types';

export const mockRegistrants: Registrant[] = [
  {
    id: 'r1',
    fullName: 'Jean Hakizimana',
    email: 'jean.hakizimana@example.com',
    phoneNumber: '0788123456',
    idNumber: '1199080012345678',
    branch: 'Kigali Main Branch',
    accountNumber: '4001234567',
    statementPeriod: '3 months',
    registrationDate: '2025-01-15T10:30:00.000Z',
    notes: 'Regular customer, requested statement for loan application',
    issuedBy: 'Sarah M.'
  },
  {
    id: 'r2',
    fullName: 'Marie Uwimana',
    email: 'marie.uwimana@example.com',
    phoneNumber: '0799765432',
    idNumber: '1198070087654321',
    branch: 'Remera Branch',
    accountNumber: '4005678901',
    statementPeriod: '6 months',
    registrationDate: '2025-01-18T14:45:00.000Z',
    issuedBy: 'John D.'
  },
  {
    id: 'r3',
    fullName: 'Claude Mugabo',
    email: 'claude.mugabo@example.com',
    phoneNumber: '0788234567',
    idNumber: '1197060023456789',
    branch: 'Nyarugenge Branch',
    accountNumber: '4001928374',
    statementPeriod: '1 year',
    registrationDate: '2025-01-20T09:15:00.000Z',
    notes: 'Business account statement',
    issuedBy: 'Sarah M.'
  },
  {
    id: 'r4',
    fullName: 'Diane Mutesi',
    email: 'diane.mutesi@example.com',
    phoneNumber: '0799876543',
    idNumber: '1196050034567890',
    branch: 'Kicukiro Branch',
    accountNumber: '4002837465',
    statementPeriod: '3 months',
    registrationDate: '2025-01-22T11:20:00.000Z',
    issuedBy: 'Peter K.'
  },
  {
    id: 'r5',
    fullName: 'Eric Habimana',
    email: 'eric.habimana@example.com',
    phoneNumber: '0788345678',
    idNumber: '1195040045678901',
    branch: 'Kimironko Branch',
    accountNumber: '4003746583',
    statementPeriod: '1 month',
    registrationDate: '2025-01-25T16:30:00.000Z',
    issuedBy: 'John D.'
  },
  {
    id: 'r6',
    fullName: 'Olive Mukamana',
    email: 'olive.mukamana@example.com',
    phoneNumber: '0799987654',
    idNumber: '1194030056789012',
    branch: 'Kigali Main Branch',
    accountNumber: '4004657392',
    statementPeriod: '6 months',
    registrationDate: '2025-01-27T13:40:00.000Z',
    notes: 'Urgent request for visa application',
    issuedBy: 'Sarah M.'
  }
];