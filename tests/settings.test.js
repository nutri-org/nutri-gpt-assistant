
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock functions
const mockSingle = jest.fn();
const mockUpsert = jest.fn();
const mockUpdate = jest.fn();

// Complete Supabase mock with all required methods
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSingle
      }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: mockUpsert
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: mockUpdate
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

// Mock auth middleware with correct path
jest.mock('../middleware/auth', () => {
  return jest.fn(() => (req, res, next) => {
    req.user = { id: 'test-user-id', plan: 'limited' };
    next();
  });
});

const settingsRoutes = require('../server/routes/settings');

describe('Settings Routes', () => {
  let app;
  let server;
  let goodToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockReset();
    mockUpsert.mockReset();
    mockUpdate.mockReset();

    goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET || 'test-secret'
    );
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

  test('gets existing settings', async () => {
    const mockData = {
      strict_prompt: 'Test prompt',
      strict_temp: 0.3,
      creative_temp: 0.8
    };

    mockSingle.mockResolvedValue({
      data: mockData,
      error: null
    });

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(res.status).toBe(200);
    expect(res.body.strict_prompt).toBe('Test prompt');
  });

  test('returns default settings when none exist', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    });

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(res.status).toBe(200);
    expect(res.body.strict_temp).toBe(0.2);
    expect(res.body.creative_temp).toBe(0.7);
  });

  test('creates new settings', async () => {
    const newSettings = {
      strict_prompt: 'Custom prompt',
      strict_temp: 0.1,
      creative_temp: 0.9
    };

    mockUpsert.mockResolvedValue({
      data: { ...newSettings, owner: 'test-user-id' },
      error: null
    });

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`)
      .send(newSettings);

    expect(res.status).toBe(200);
    expect(res.body.strict_prompt).toBe('Custom prompt');
  });

  test('partially updates settings', async () => {
    const updateData = { strict_temp: 0.1 };

    mockUpdate.mockResolvedValue({
      data: { strict_temp: 0.1, owner: 'test-user-id' },
      error: null
    });

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.strict_temp).toBe(0.1);
  });
});
