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
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

const stripe = require('stripe')();
const supabase = require('../server/lib/supabase');
const billingRoutes = require('../server/routes/billing');

const app = express();
app.use('/api/billing', billingRoutes);

describe('Billing Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SIGNING_SECRET = 'test-secret';
  });

  test('handles valid Stripe webhook', async () => {
    const stripe = require('stripe')();
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_email: 'test@example.com',
          metadata: { plan: 'premium' }
        }
      }
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid-signature')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  test('rejects invalid webhook signature', async () => {
    const stripe = require('stripe')();
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
    const stripe = require('stripe')();
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: {} }
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'valid-signature')
      .send(Buffer.from('test-payload'));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(supabase.from().update).not.toHaveBeenCalled();
  });
});