import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xqqfkczvtdrqazjnrxvs.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_0jZYC7MyeQaR4aehlfwp7g_VG8f1V95';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
