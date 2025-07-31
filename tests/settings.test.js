const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Supabase
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn()
    }))
  })),
  rpc: jest.fn(() => Promise.resolve({ error: null }))
}));

const supabase = require('../server/lib/supabase');
const settingsRoutes = require('../server/routes/settings');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

app.use('/api/settings', settingsRoutes);

describe('Settings Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('gets existing settings', async () => {
    const mockSettings = {
      strict_prompt: 'Test prompt',
      creative_prompt: 'Creative prompt',
      strict_temp: 0.2,
      creative_temp: 0.7
    };

    supabase.from().select().eq().single.mockResolvedValue({
      data: mockSettings,
      error: null
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(res.status).toBe(200);
    expect(res.body.strict_prompt).toBe('Test prompt');
  });

  test('returns default settings when none exist', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(res.status).toBe(200);
    expect(res.body.strict_temp).toBe(0.2);
    expect(res.body.creative_temp).toBe(0.7);
  });

  test('creates new settings', async () => {
    const newSettings = {
      strict_prompt: 'New strict prompt',
      creative_prompt: 'New creative prompt'
    };

    supabase.from().upsert().select().single.mockResolvedValue({
      data: { ...newSettings, owner: 'test-user-id' },
      error: null
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .put('/api/settings')
      .send(newSettings)
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(200);
    expect(response.body.strict_prompt).toBe('New strict prompt');
  });

  test('partially updates settings', async () => {
    const updateData = { strict_temp: 0.1 };

    supabase.from().update().eq().select().single.mockResolvedValue({
      data: { strict_temp: 0.1, owner: 'test-user-id' },
      error: null
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .patch('/api/settings')
      .send(updateData)
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(200);
    expect(response.body.strict_temp).toBe(0.1);
  });

  test('deletes settings', async () => {
    supabase.from().delete().eq.mockResolvedValue({
      error: null
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .delete('/api/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Settings reset to defaults');
  });
});