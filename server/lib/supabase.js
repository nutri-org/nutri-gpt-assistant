
const { createClient } = require('@supabase/supabase-js');

// In Replit we rely on env vars.  The tests will stub this file, so a dummy URL/key is fine.
const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://example.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_ANON || 'anon';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helpers the middleware/tests expect
module.exports = {
  supabase,
  from:    (...args) => supabase.from(...args),
  storage: supabase.storage,
  sql:     (literals, ...expr) => ({ text: literals.join('?'), values: expr }) // exported for future migrations
};
