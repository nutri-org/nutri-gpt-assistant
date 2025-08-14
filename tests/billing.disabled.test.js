// /tests/billing.disabled.test.js
const request = require('supertest');

describe('Billing webhook — Dormant-Until-Live guard', () => {
  let app;
  const originalSecret = process.env.STRIPE_SIGNING_SECRET;
  const originalEnabled = process.env.STRIPE_ENABLED;

  beforeAll(() => {
    delete process.env.STRIPE_SIGNING_SECRET;
    process.env.STRIPE_ENABLED = 'false';
    app = require('../server/app'); // import the real app
  });

  afterAll(() => {
    if (originalSecret) process.env.STRIPE_SIGNING_SECRET = originalSecret;
    if (originalEnabled !== undefined) process.env.STRIPE_ENABLED = originalEnabled;
    else delete process.env.STRIPE_ENABLED;
  });

  it('returns 501 when Stripe is not enabled', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('content-type', 'application/json')
      .send(Buffer.from('payload'));

    expect(res.status).toBe(501);
    expect(res.body).toEqual({ error: 'Billing not enabled' });
  });
});
