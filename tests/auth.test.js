const request = require('supertest');
const jwt     = require('jsonwebtoken');

const app = require('../server/server');

const secret   = process.env.JWT_SECRET;
const goodToken = jwt.sign({ id: 'u1', plan: 'free' }, secret);

describe('auth middleware', () => {
  test('should reject no-token request', async () => {
    const res = await request(app).get('/api/healthz');
    expect(res.status).toBe(401);
  });

  test('should reject bad token', async () => {
    const res = await request(app)
      .get('/api/healthz')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('should accept valid token', async () => {
    const res = await request(app)
      .get('/api/healthz')
      .set('Authorization', `Bearer ${goodToken}`);
    expect(res.status).toBe(200);
  });
});

afterAll(() => jest.clearAllMocks());