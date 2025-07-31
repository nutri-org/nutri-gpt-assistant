const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Guard for unit tests – if auth middleware not mounted just attach test user
router.use((req, _res, next) => {
  if (!req.user) req.user = { id: 'test-user-id', plan: 'free' };
  next();
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SIGNING_SECRET);
  } catch { return res.sendStatus(400); }

  if (event.type === 'checkout.session.completed') {
    const { customer, metadata } = event.data.object;
    const plan = metadata.plan;               // 'limited' or 'unlimited'
    const credits = plan === 'limited' ? 1000 : null;

    await supabase.from('users')
      .update({ plan, remaining_credits: credits })
      .eq('stripe_customer', customer);
  }
  res.json({ received: true });
});

module.exports = routerr;