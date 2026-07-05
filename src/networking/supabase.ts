import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Mục đích: Tạo singleton Supabase client dùng chung toàn app
export const supabase = createClient(supabaseUrl, supabaseKey);
