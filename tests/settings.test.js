const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Supabase with proper chain structure
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
    }))
  }))
}));

const supabase = require('../server/lib/supabase');
const settingsRoutes = require('../server/routes/settings');

const app = express();
app.use(express.json());
app.use('/api/assistant/settings', settingsRoutes);

describe('Settings Routes', () => {
  let goodToken;

  beforeEach(() => {
    jest.clearAllMocks();
    goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );
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

    supabase.from().select().eq().single.mockResolvedValue({
      data: mockData,
      error: null
    });

    const res = await request(app)
      .get('/api/assistant/settings')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(res.status).toBe(200);
    expect(res.body.strict_prompt).toBe('Test prompt');
  });

  test('returns default settings when none exist', async () => {
    supabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    });

    const res = await request(app)
      .get('/api/assistant/settings')
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

    supabase.from().upsert().select().single.mockResolvedValue({
      data: { ...newSettings, owner: 'test-user-id' },
      error: null
    });

    const res = await request(app)
      .post('/api/assistant/settings')
      .set('Authorization', `Bearer ${goodToken}`)
      .send(newSettings);

    expect(res.status).toBe(200);
    expect(res.body.strict_prompt).toBe('Custom prompt');
  });

  test('partially updates settings', async () => {
    const updateData = { strict_temp: 0.1 };

    supabase.from().update().eq().select().single.mockResolvedValue({
      data: { strict_temp: 0.1, owner: 'test-user-id' },
      error: null
    });

    const res = await request(app)
      .patch('/api/assistant/settings')
      .set('Authorization', `Bearer ${goodToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.strict_temp).toBe(0.1);
  });
});