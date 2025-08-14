// /tests/billing.integration.test.js
const request = require('supertest');

// Mock Stripe BEFORE requiring app (so billing.js sees mocked constructEvent)
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => {
  return jest.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent }
  }));
});

// Mock Supabase client creation to avoid real init/network during app import
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
}));

describe('Billing webhook (full app) — mount order proof', () => {
  let app;

  beforeAll(() => {
    process.env.STRIPE_SIGNING_SECRET = 'whsec_test';
    process.env.STRIPE_ENABLED = 'true';
    // Return a benign event to bypass DB side effects
    mockConstructEvent.mockReturnValue({
      type: 'invoice.created',
      data: { object: {} }
    });
    app = require('../server/app'); // import the real app AFTER mocks
  });

  it('preserves raw body and verifies signature via Stripe constructEvent', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid')
      .set('content-type', 'application/json')
      .send(Buffer.from('payload')); // raw buffer

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(mockConstructEvent).toHaveBeenCalled();
  });
});
