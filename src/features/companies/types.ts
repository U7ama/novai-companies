export type CompanyStatus =
  | 'new'
  | 'researching'
  | 'contacted'
  | 'qualified'
  | 'rejected';

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  status: CompanyStatus;
  version: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
};
