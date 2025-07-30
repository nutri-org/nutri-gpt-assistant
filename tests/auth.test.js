jest.mock('../server/lib/openaiClient', () => ({
  completion: jest.fn()
}));

const app          = require('../server/app');        // pure app, no server

const request = require('supertest');
const jwt     = require('jsonwebtoken');

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
      .get('/api/healthz')
      .set('Authorization', `Bearer ${goodToken}`);
    expect(res.status).toBe(200);
  });
});

afterAll(async () => {
  if (app.close) await new Promise(res => app.close(res));
  jest.clearAllMocks();
});