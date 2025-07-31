// tests/quota.test.js   ← replace the whole file with this
const request  = require('supertest');
const express  = require('express');
const quota    = require('../middleware/quota');

// ────── Supabase mock ──────
jest.mock('../server/lib/supabase', () => {
  // one self‑returning stub object
  const stub = {
    /* chainable helpers – always return the same stub */
    from   : jest.fn(() => stub),
    select : jest.fn(() => stub),
    eq     : jest.fn(() => stub),
    update : jest.fn(() => stub),
    /* leaf helpers we override in each test */
    single : jest.fn(),
    rpc    : jest.fn(() => Promise.resolve({ error: null }))
  };
  return stub;
});
const supabase = require('../server/lib/supabase');

// ────── Express app with mocked auth ──────
const app = express();
app.use(express.json());
app.use((req, res, next) => { req.user = { id: 'test-user-id' }; next(); });
app.use(quota);
app.post('/test', (_req, res) => res.json({ ok: true }));

// ────── test helpers ──────
beforeEach(() => {
  jest.clearAllMocks();               // wipe call history
  supabase.single.mockReset();        // keep the fn but clear behaviour
});
afterAll(() => jest.resetAllMocks()); // tidy up for Jest

/* ────── Tests ────── */
test('allows request with sufficient credits', async () => {
  supabase.single.mockResolvedValueOnce({
    data: { plan: 'limited', remaining_credits: 100 }, error: null
  });

  const res = await request(app).post('/test');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

test('blocks request with insufficient credits', async () => {
  supabase.single.mockResolvedValueOnce({
    data: { plan: 'limited', remaining_credits: 0 }, error: null
  });

  const res = await request(app).post('/test');
  expect(res.status).toBe(403);
  expect(res.body.error).toBe('QUOTA_EXCEEDED');
});

test('allows unlimited plan users', async () => {
  supabase.single.mockResolvedValueOnce({
    data: { plan: 'unlimited', remaining_credits: null }, error: null
  });

  const res = await request(app).post('/test');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
