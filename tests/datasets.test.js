
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock multer to handle file uploads
jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      if (req.body.filename && req.body.fileData) {
        req.file = {
          originalname: req.body.filename,
          buffer: Buffer.from(req.body.fileData, 'base64')
        };
      }
      next();
    })
  }));
  return multer;
});

// Complete Supabase mock including storage with getPublicUrl
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://example.com/file.csv' }
      }))
    }))
  }
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => {
  return jest.fn(() => (req, res, next) => {
    req.user = { id: 'test-user-id', plan: 'limited' };
    next();
  });
});

// Mock quota middleware
jest.mock('../../middleware/quota', () => (req, res, next) => next());

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

    supabase.from().insert().select().single.mockResolvedValue({
      data: {
        id: 'test-id',
        filename: 'test.csv',
        url: 'https://example.com/file.csv',
        created_at: new Date().toISOString()
      },
      error: null
    });

    const response = await request(app)
      .post('/api/datasets/upload')
      .send({
        filename: 'test.csv',
        fileData: Buffer.from('csv,data\n1,test').toString('base64')
      })
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.dataset.filename).toBe('test.csv');
  });

  test('handles upload errors', async () => {
    supabase.storage.from().upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' }
    });

    const response = await request(app)
      .post('/api/datasets/upload')
      .send({
        filename: 'test.csv',
        fileData: Buffer.from('csv,data').toString('base64')
      })
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Upload failed');
  });

  test('requires file data', async () => {
    const response = await request(app)
      .post('/api/datasets/upload')
      .send({
        filename: 'test-dataset'
        // missing fileData
      })
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('filename and fileData are required');
  });
});
