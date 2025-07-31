
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl  = process.env.SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase     = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }});

module.exports = supabase;
