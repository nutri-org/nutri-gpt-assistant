// /jest.setup.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
jest.setTimeout(15000);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
process.env.STRIPE_SIGNING_SECRET = process.env.STRIPE_SIGNING_SECRET || 'whsec_test';
