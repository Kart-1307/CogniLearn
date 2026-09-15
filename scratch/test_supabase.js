import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

async function test() {
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log('QUERY RESULT data:', data);
  console.log('QUERY RESULT error:', error);
}

test().catch(console.error);
