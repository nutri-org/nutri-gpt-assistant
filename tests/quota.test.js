
// tests/quota.test.js   ← replace the whole file with this
const request  = require('supertest');
const express  = require('express');

// ────── Supabase mock ──────
const mockSingle = jest.fn();
const mockRpc = jest.fn(() => Promise.resolve({ error: null }));

jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSingle
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  })),
  rpc: mockRpc
}));

const supabase = require('../server/lib/supabase');
const quota    = require('../middleware/quota');

// ────── Express app with mocked auth ──────
const app = express();
app.use(express.json());
app.use((req, res, next) => { req.user = { id: 'test-user-id', plan: 'limited' }; next(); });
app.use(quota);
app.post('/test', (_req, res) => res.json({ ok: true }));

// ────── test helpers ──────
beforeEach(() => {
  jest.clearAllMocks();               // wipe call history
  mockSingle.mockReset();             // keep the fn but clear behaviour
  mockRpc.mockReturnValue(Promise.resolve({ error: null }));
});
afterAll(() => jest.resetAllMocks()); // tidy up for Jest

/* ────── Tests ────── */
test('allows request with sufficient credits', async () => {
  mockSingle.mockResolvedValueOnce({
    data: { remaining_credits: 100 }, error: null
  });

  const res = await request(app).post('/test');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

test('blocks request with insufficient credits', async () => {
  mockSingle.mockResolvedValueOnce({
    data: { remaining_credits: 0 }, error: null
  });

  const res = await request(app).post('/test');
  expect(res.status).toBe(403);
  expect(res.body.error).toBe('QUOTA_EXCEEDED');
});

test('allows unlimited plan users', async () => {
  // For unlimited users, middleware checks req.user.plan before querying DB
  const appWithUnlimited = express();
  appWithUnlimited.use(express.json());
  appWithUnlimited.use((req, res, next) => { req.user = { id: 'test-user-id', plan: 'unlimited' }; next(); });
  appWithUnlimited.use(quota);
  appWithUnlimited.post('/test', (_req, res) => res.json({ ok: true }));

  const res = await request(appWithUnlimited).post('/test');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
