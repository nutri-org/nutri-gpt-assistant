// /tests/billing.dberror.test.js
const request = require('supertest');

// Mock Stripe BEFORE requiring app
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => {
  return jest.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent }
  }));
});

// Mock Supabase to resolve with an error object (common SDK pattern)
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: { message: 'boom' } })
      })
    })
  })
}));

describe('Billing webhook — DB error still acks', () => {
  let app;
  let warnSpy;

  beforeAll(() => {
    process.env.STRIPE_SIGNING_SECRET = 'whsec_test';
    process.env.STRIPE_ENABLED = 'true';
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_x', metadata: { plan: 'limited' } } }
    });
    app = require('../server/app');
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('returns 200 and logs a warning when Supabase returns an error', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid')
      .set('content-type', 'application/json')
      .send(Buffer.from('payload'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(warnSpy).toHaveBeenCalled();
    const msg = warnSpy.mock.calls.map(c => String(c[0])).join(' ');
    expect(msg).toMatch(/Webhook DB update failed/);
  });
});
