import { supabase } from '@/networking/supabase';
import type {
  EvdDocument,
  EvdListParams,
  EvdListResponse,
  CreateEvdDto,
  UpdateEvdDto,
} from '../types/evd.types';

const TABLE = 'documents';

// Mục đích: Lấy danh sách tài liệu EVD với phân trang, tìm kiếm và bộ lọc phía server
export async function fetchEvdList(
  params: EvdListParams,
  currentUserId?: string,
  isStaff?: boolean,
): Promise<EvdListResponse> {
  const { search, status, category, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' });

  // Mục đích: Nếu là STAFF, chỉ lấy tài liệu do chính user tạo
  if (isStaff && currentUserId) {
    query = query.eq('created_by', currentUserId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category', category);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as EvdDocument[],
    count: count ?? 0,
  };
}

// Mục đích: Tạo mới một tài liệu EVD
export async function createEvdDocument(dto: CreateEvdDto): Promise<EvdDocument> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([dto])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EvdDocument;
}

// Mục đích: Cập nhật tài liệu EVD theo ID
export async function updateEvdDocument(
  id: string,
  dto: UpdateEvdDto,
): Promise<EvdDocument> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...dto, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EvdDocument;
}

// Mục đích: Xóa tài liệu EVD theo ID
export async function deleteEvdDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Mục đích: Chèn hàng loạt tài liệu theo từng batch 1000 dòng để tránh timeout
export async function batchInsertEvd(
  rows: {
    code: string;
    title: string;
    category: string;
    status: string;
    created_by: string;
  }[],
  onProgress?: (inserted: number, total: number) => void,
): Promise<void> {
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from(TABLE).insert(batch);
    if (error) throw new Error(`Batch insert failed at row ${i}: ${error.message}`);

    inserted += batch.length;
    onProgress?.(inserted, rows.length);
  }
}
