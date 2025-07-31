
const request = require('supertest');
const express = require('express');

// Mock Stripe constructor and instance
const mockConstructEvent = jest.fn();
const mockStripeInstance = {
  webhooks: {
    constructEvent: mockConstructEvent
  }
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripeInstance);
});

// Mock functions for reuse
const mockUpdate = jest.fn();
const mockEq = jest.fn();

// Mock Supabase
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    update: mockUpdate
  }))
}));

const supabase = require('../server/lib/supabase');
const billingRoutes = require('../server/routes/billing');

describe('Billing Routes', () => {
  let app;
  let server;

  beforeAll(() => {
    app = express();
    app.use('/api/billing', billingRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConstructEvent.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    
    process.env.STRIPE_SIGNING_SECRET = 'test-secret';
    
    // Setup default mock chain
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
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

  test('handles valid Stripe webhook', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test123',
          customer_email: 'test@example.com',
          metadata: { plan: 'premium' }
        }
      }
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid-signature')
      .set('content-type', 'application/json')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('stripe_customer', 'cus_test123');
  });

  test('rejects invalid webhook signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'invalid-signature')
      .set('content-type', 'application/json')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(400);
  });

  test('ignores non-checkout events', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: {} }
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid-signature')
      .set('content-type', 'application/json')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
