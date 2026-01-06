
export type Status = 'DONE' | 'NOT_DONE' | 'NA' | 'PENDING';

export interface Report {
  id: string;
  name: string;
  quarterlyMonths?: number[]; // Índices dos meses permitidos (ex: [3, 5, 8, 11])
}

export interface Program {
  id: string;
  name: string;
  reports: Report[];
}

export interface MonthlyStatus {
  [monthIndex: number]: Status; // 0-11
}

export interface ReportData {
  [usId: string]: {
    [reportId: string]: MonthlyStatus;
  };
}

export interface VerificationData {
  verifiedBy: string;
  jobTitle: string;
  date: string;
  observations: string;
}

export interface VerificationStore {
  [usId: string]: VerificationData;
}

export interface ActionPlanItem {
  unit: string;
  issue: string;
  action: string;
  responsible: string;
  priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
  deadline: string;
}

export interface HealthUnit {
  id: string;
  name: string;
}

export interface DashboardStats {
  totalExpected: number;
  totalReceived: number;
  totalNA: number;
  totalPending: number;
  percentageReceived: number;
}

export interface SubmissionEntry {
  id: string;
  timestamp: string;
  usName: string;
  year: number;
  totalReports: number;
  receivedCount: number;
  performance: number;
}
