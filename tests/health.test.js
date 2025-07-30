const request = require('supertest');
const app = require('../server/app');

describe('GET /api/healthz', () => {
  test('should return 200 and JSON with status, version, uptime keys', async () => {
    const res = await request(app)
      .get('/api/healthz');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

afterAll(async () => {
  if (app.close) await new Promise(res => app.close(res));
  jest.clearAllMocks();
});