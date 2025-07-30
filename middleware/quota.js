const supabase = require('../server/lib/supabase');

module.exports = function quota() {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED' });

    if (req.user.plan === 'unlimited') return next();

    const { data, error } = await supabase
      .from('users')
      .select('remaining_credits')
      .eq('id', req.user.id)
      .single();

    if (error) return next(error);
    if (data.remaining_credits < 1) return res.status(402).json({ error: 'NO_CREDITS' });

    const { error: updateErr } = await supabase.rpc('decrement_credit', { uid: req.user.id });
    return updateErr ? next(updateErr) : next();
  };
};