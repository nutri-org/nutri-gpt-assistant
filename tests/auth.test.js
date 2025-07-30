const request = require('supertest');
const jwt     = require('jsonwebtoken');

const { app } = require('../server/server');

const secret   = process.env.JWT_SECRET;
const goodToken = jwt.sign({ id: 'u1', plan: 'free' }, secret);

describe('auth middleware', () => {
  test('should reject no-token request', async () => {
    const res = await request(app).post('/api/chat');
    expect(res.status).toBe(401);
  });

  test('should reject bad token', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('should accept valid token', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`);
    expect(res.status).toBe(200);
  });
});

afterAll(async () => {
  // Close any open handles from the imported app
  if (app && app.close) {
    await new Promise(resolve => app.close(resolve));
  }
  jest.clearAllMocks();
});