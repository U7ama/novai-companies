import { z } from 'zod';

export const COMPANY_STATUSES = [
  'new',
  'researching',
  'contacted',
  'qualified',
  'rejected'
] as const;
export const COMPANY_SORTS = ['name', '-name', 'created_at', '-created_at'] as const;

const fields = {
  name: z.string().trim().min(1, 'Company name is required'),
  domain: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (value.length <= 253 &&
          value.split('.').length > 1 &&
          value.split('.').every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))),
      'Enter a valid domain name'
    )
    .nullable()
    .optional(),
  status: z.enum(COMPANY_STATUSES).optional()
};

export const createCompanySchema = z.object(fields);
export const updateCompanySchema = createCompanySchema.partial().extend({
  if_version: z.number().int().positive()
});

export function validationErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? 'body'), issue.message])
  );
}
