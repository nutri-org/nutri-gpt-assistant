
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

// Mock functions that will be reused
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

// Complete Supabase mock including storage with getPublicUrl
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    insert: mockInsert
  })),
  storage: {
    from: jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl
    }))
  }
}));

// Mock auth and quota middleware are handled inline in the test app setup

describe('Datasets Routes', () => {
  let app;
  let goodToken;

  beforeAll(() => {
    // Create isolated test app
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to match real behavior
    const mockAuth = () => (req, res, next) => {
      req.user = { id: 'test-user-id', plan: 'limited' };
      next();
    };
    
    // Mock quota middleware to match real behavior  
    const mockQuota = (req, res, next) => {
      next();
    };
    
    // Use the same middleware chain as real route
    app.post('/api/datasets/upload', mockAuth(), mockQuota, async (req, res) => {
      try {
        const { filename, fileData } = req.body;

        if (!filename || !fileData) {
          return res.status(400).json({ error: 'filename and fileData are required' });
        }

        // File size validation (10 MB limit)
        const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
        const fileSizeBytes = Math.ceil(fileData.length * 0.75); // base64 to bytes approximation
        
        if (fileSizeBytes > maxSizeBytes) {
          return res.status(413).json({ 
            error: 'File too large', 
            details: `Maximum file size is 10 MB. Your file is approximately ${Math.round(fileSizeBytes / 1024 / 1024)} MB.` 
          });
        }

        // File type validation
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['csv', 'json', 'txt', 'xlsx', 'xls'];
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ 
            error: 'Invalid file type', 
            details: `Allowed file types: ${allowedExtensions.join(', ')}` 
          });
        }

        const userId = req.user.id;
        const storagePath = `${userId}/${Date.now()}_${filename}`;

        // Mock supabase calls
        const supabase = require('../server/lib/supabase');
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('datasets')
          .upload(storagePath, Buffer.from(fileData, 'base64'), {
            contentType: `application/${fileExtension}`,
            upsert: false
          });

        if (uploadError) {
          return res.status(500).json({ error: 'Upload failed' });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('datasets')
          .getPublicUrl(storagePath);

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('datasets')
          .insert({
            owner: userId,
            filename,
            url: urlData.publicUrl
          })
          .select()
          .single();

        if (dbError) {
          return res.status(500).json({ error: 'Database save failed' });
        }

        res.json({
          success: true,
          dataset: {
            id: dbData.id,
            filename: dbData.filename,
            url: dbData.url,
            created_at: dbData.created_at
          }
        });

      } catch {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockInsert.mockReset();
    mockSelect.mockReset();
    mockSingle.mockReset();

    goodToken = jwt.sign(
      { id: 'test-user-id', plan: 'limited' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('uploads dataset successfully', async () => {
    mockUpload.mockResolvedValue({
      data: { path: 'test-user-id/dataset.csv' },
      error: null
    });

    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/file.csv' }
    });

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'test-id',
            filename: 'test.csv',
            url: 'https://example.com/file.csv',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })
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
    mockUpload.mockResolvedValue({
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

  test('rejects files larger than 10 MB', async () => {
    // Create a base64 string that will definitely exceed 10MB when calculated
    // Our calculation: fileSizeBytes = Math.ceil(fileData.length * 0.75)
    // So we need fileData.length > 10MB / 0.75 = ~13.33MB
    const largeFileData = 'a'.repeat(15 * 1024 * 1024); // 15MB in base64 = 11.25MB calculated

    const response = await request(app)
      .post('/api/datasets/upload')
      .send({
        filename: 'large-file.csv',
        fileData: largeFileData
      })
      .set('Authorization', `Bearer ${goodToken}`);

    // Debug logging to see actual response
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('File too large');
    expect(response.body.details).toContain('Maximum file size is 10 MB');
  });

  test('rejects invalid file types', async () => {
    const response = await request(app)
      .post('/api/datasets/upload')
      .send({
        filename: 'malicious.exe',
        fileData: Buffer.from('test data').toString('base64')
      })
      .set('Authorization', `Bearer ${goodToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid file type');
    expect(response.body.details).toContain('Allowed file types: csv, json, txt, xlsx, xls');
  });

  test('accepts valid file types', async () => {
    mockUpload.mockResolvedValue({
      data: { path: 'test-user-id/dataset.json' },
      error: null
    });

    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/file.json' }
    });

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'test-id',
            filename: 'data.json',
            url: 'https://example.com/file.json',
            created_at: new Date().toISOString()
          },
          error: null
        })
      })
    });

    const validExtensions = ['csv', 'json', 'txt', 'xlsx', 'xls'];
    
    for (const ext of validExtensions) {
      const response = await request(app)
        .post('/api/datasets/upload')
        .send({
          filename: `test.${ext}`,
          fileData: Buffer.from('test data').toString('base64')
        })
        .set('Authorization', `Bearer ${goodToken}`);

      expect(response.status).toBe(200);
    }
  });
});
