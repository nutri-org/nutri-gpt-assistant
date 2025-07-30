
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Supabase
jest.mock('../server/lib/supabase', () => ({
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn()
    }))
  },
  from: jest.fn(() => ({
    insert: jest.fn()
  }))
}));

const supabase = require('../server/lib/supabase');
const datasetsRoutes = require('../server/routes/datasets');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

app.use('/api/datasets', datasetsRoutes);

describe('Datasets Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads dataset successfully', async () => {
    supabase.storage.from().upload.mockResolvedValue({
      data: { path: 'test-user-id/dataset.csv' },
      error: null
    });

    supabase.from().insert.mockResolvedValue({
      data: [{ id: 1, name: 'test-dataset' }],
      error: null
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/datasets/upload')
      .attach('file', Buffer.from('csv,data\n1,test'), 'test.csv')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Dataset uploaded successfully');
  });

  test('handles upload errors', async () => {
    supabase.storage.from().upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' }
    });

    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/datasets/upload')
      .attach('file', Buffer.from('csv,data'), 'test.csv')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Upload failed');
  });

  test('requires file attachment', async () => {
    const goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'test-dataset')
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No file uploaded');
  });
});
