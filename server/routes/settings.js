const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const auth = require('../../middleware/auth');

// GET /api/settings - retrieve user's assistant settings
router.get('/', auth(), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assistant_settings')
      .select('*')
      .eq('owner', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Return default settings if none exist
    if (!data) {
      return res.json({
        strict_prompt: null,
        creative_prompt: null,
        strict_tasks: [],
        creative_tasks: [],
        strict_temp: 0.2,
        creative_temp: 0.7
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /api/settings - create or update assistant settings
router.put('/', auth(), async (req, res) => {
  try {
    const {
      strict_prompt,
      creative_prompt,
      strict_tasks,
      creative_tasks,
      strict_temp,
      creative_temp
    } = req.body;

    const settingsData = {
      owner: req.user.id,
      strict_prompt,
      creative_prompt,
      strict_tasks,
      creative_tasks,
      strict_temp,
      creative_temp
    };

    const { data, error } = await supabase
      .from('assistant_settings')
      .upsert(settingsData, { onConflict: 'owner' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PATCH /api/settings - partial update of assistant settings
router.patch('/', auth(), async (req, res) => {
  try {
    const updateData = req.body;
    
    // Remove owner field if present to prevent unauthorized changes
    delete updateData.owner;

    const { data, error } = await supabase
      .from('assistant_settings')
      .update(updateData)
      .eq('owner', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Settings not found' });
      }
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /api/settings - reset to default settings
router.delete('/', auth(), async (req, res) => {
  try {
    const { error } = await supabase
      .from('assistant_settings')
      .delete()
      .eq('owner', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json({ message: 'Settings reset to defaults' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;