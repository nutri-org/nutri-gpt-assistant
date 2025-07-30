const request = require('supertest');
const express = require('express');
const quota = require('../middleware/quota');

// Mock Supabase
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}));

const supabase = require('../server/lib/supabase');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

app.use(quota);
app.post('/test', (req, res) => res.json({ success: true }));

describe('Quota Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows request with sufficient credits', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: { plan: 'limited', remaining_credits: 100 },
      error: null
    });

    supabase.from().update().eq.mockResolvedValue({
      error: null
    });

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('blocks request with insufficient credits', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: { plan: 'limited', remaining_credits: 0 },
      error: null
    });

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('QUOTA_EXCEEDED');
  });

  test('allows unlimited plan users', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: { plan: 'unlimited', remaining_credits: null },
      error: null
    });

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});