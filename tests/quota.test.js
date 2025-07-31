
const request = require('supertest');
const express = require('express');

// Mock functions that will be reused
const mockSingle = jest.fn();
const mockRpc = jest.fn();

// Supabase mock with proper promise chain
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSingle
      }))
    }))
  })),
  rpc: mockRpc
}));

const quota = require('../middleware/quota');

// Test app setup
const createTestApp = (userPlan = 'limited') => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { id: 'test-user-id', plan: userPlan };
    next();
  });
  app.use(quota());
  app.post('/test', (req, res) => res.json({ ok: true }));
  return app;
};

describe('Quota Middleware', () => {
  let server;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockReset();
    mockRpc.mockReset();
  });

  afterEach(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      server = null;
    }
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('allows request with sufficient credits', async () => {
    mockSingle.mockResolvedValue({
      data: { remaining_credits: 100 },
      error: null
    });
    mockRpc.mockResolvedValue({ error: null });

    const app = createTestApp();
    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('blocks request with insufficient credits', async () => {
    mockSingle.mockResolvedValue({
      data: { remaining_credits: 0 },
      error: null
    });

    const app = createTestApp();
    const res = await request(app).post('/test');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('QUOTA_EXCEEDED');
  });

  test('allows unlimited plan users', async () => {
    const app = createTestApp('unlimited');
    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // Should not have called database at all
    expect(mockSingle).not.toHaveBeenCalled();
  });
});
