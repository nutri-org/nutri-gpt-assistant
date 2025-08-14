// /server/routes/billing.js
const stripe = require('stripe')(process.env.STRIPE_API_KEY || 'sk_test_dummy_key_for_development');
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Stripe Webhook — RAW parser required (mounted before any JSON parser in app.js)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Dormant-Until-Live: if Stripe isn't enabled, short-circuit with 501
  if (!process.env.STRIPE_SIGNING_SECRET || process.env.STRIPE_ENABLED === 'false') {
    return res.status(501).json({ error: 'Billing not enabled' });
    // No verification; no side-effects; no network calls.
  }

  const sig = req.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SIGNING_SECRET);
  } catch {
    // Invalid signature or malformed body
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    const { customer, metadata } = event.data.object;
    const plan = metadata && metadata.plan ? metadata.plan : undefined; // expected: 'limited' or 'unlimited'
    const credits = plan === 'limited' ? 1000 : null;

    try {
      const { error } = await supabase.from('users')
        .update({ plan, remaining_credits: credits })
        .eq('stripe_customer', customer);

      if (error) {
        // Observability for returned error objects (Supabase v2 pattern)
        console.warn('Webhook DB update failed:', error.message || error);
      }
    } catch (e) {
      // Avoid retry storms from Stripe; log and acknowledge
      console.warn('Webhook DB update failed:', e && e.message ? e.message : e);
    }
  }

  res.json({ received: true });
});

module.exports = router;
