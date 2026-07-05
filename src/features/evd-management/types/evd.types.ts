import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EvdStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type EvdCategory = 'LEGAL' | 'FINANCIAL' | 'TECHNICAL' | 'HR' | 'OTHER';

export const EVD_STATUS_OPTIONS: { label: string; value: EvdStatus }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
];

export const EVD_CATEGORY_OPTIONS: { label: string; value: EvdCategory }[] = [
  { label: 'Legal', value: 'LEGAL' },
  { label: 'Financial', value: 'FINANCIAL' },
  { label: 'Technical', value: 'TECHNICAL' },
  { label: 'HR', value: 'HR' },
  { label: 'Other', value: 'OTHER' },
];

// ─── Domain Model ─────────────────────────────────────────────────────────────

export interface EvdDocument {
  id: string;
  code: string;
  title: string;
  category: EvdCategory;
  status: EvdStatus;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface EvdListParams {
  search?: string;
  status?: EvdStatus | '';
  category?: EvdCategory | '';
  page: number;
  pageSize: number;
}

export interface EvdListResponse {
  data: EvdDocument[];
  count: number;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateEvdDto {
  code: string;
  title: string;
  category: EvdCategory;
  status: EvdStatus;
  created_by: string;
}

export interface UpdateEvdDto {
  code?: string;
  title?: string;
  category?: EvdCategory;
  status?: EvdStatus;
}

// ─── Zod Schema (for react-hook-form) ────────────────────────────────────────

export const createEvdSchema = z.object({
  code: z
    .string()
    .min(1, 'evd.validation.codeRequired')
    .max(20, 'evd.validation.codeMaxLength')
    .regex(/^[A-Z0-9-_]+$/i, 'evd.validation.codeFormat'),
  title: z
    .string()
    .min(1, 'evd.validation.titleRequired')
    .max(255, 'evd.validation.titleMaxLength'),
  category: z.enum(['LEGAL', 'FINANCIAL', 'TECHNICAL', 'HR', 'OTHER'], {
    error: 'evd.validation.categoryRequired',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT'], {
    error: 'evd.validation.statusRequired',
  }),
});


export type CreateEvdFormValues = z.infer<typeof createEvdSchema>;

// ─── Import Types ─────────────────────────────────────────────────────────────

export interface ImportRow {
  code: string;
  title: string;
  category: string;
  status: string;
  [key: string]: string;
}

export interface InvalidImportRow {
  row: ImportRow;
  rowIndex: number;
  errors: string[];
}

export interface ImportResult {
  valid: ImportRow[];
  invalid: InvalidImportRow[];
  totalRows: number;
}

// ─── Worker Messages ──────────────────────────────────────────────────────────



export type WorkerOutboundMessage =
  | { type: 'progress'; percent: number; processed: number; total: number }
  | { type: 'done'; result: ImportResult }
  | { type: 'error'; message: string };
