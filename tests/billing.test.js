
const request = require('supertest');
const express = require('express');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn()
    }))
  }))
}));

const stripe = require('stripe')();
const supabase = require('../lib/supabase');
const billingRoutes = require('../server/routes/billing');

const app = express();
app.use('/api/billing', billingRoutes);

describe('Billing Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SIGNING_SECRET = 'test-secret';
  });

  test('handles valid Stripe webhook', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test123',
          metadata: { plan: 'limited' }
        }
      }
    };

    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    supabase.from().update().eq.mockResolvedValue({ error: null });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  test('rejects invalid webhook signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'invalid-signature')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(400);
  });

  test('ignores non-checkout events', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: { object: {} }
    };

    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(supabase.from().update).not.toHaveBeenCalled();
  });
});
