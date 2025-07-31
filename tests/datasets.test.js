
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Complete Supabase mock including storage
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    insert: jest.fn()
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn()
    }))
  }
}));

const supabase = require('../server/lib/supabase');
const datasetsRoutes = require('../server/routes/datasets');

describe('Datasets Routes', () => {
  let app;
  let server;
  let goodToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/datasets', datasetsRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('uploads dataset successfully', async () => {
    supabase.storage.from().upload.mockResolvedValue({
      data: { path: 'test-user-id/dataset.csv' },
      error: null
    });

    supabase.from().insert.mockResolvedValue({ error: null });

    const response = await request(app)
      .post('/api/datasets/upload')
      .attach('file', Buffer.from('csv,data\n1,test'), 'test.csv')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('handles upload errors', async () => {
    supabase.storage.from().upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' }
    });

    const response = await request(app)
      .post('/api/datasets/upload')
      .attach('file', Buffer.from('csv,data'), 'test.csv')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('UPLOAD_FAILED');
  });

  test('requires file attachment', async () => {
    const response = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('NO_FILE');
  });
});
