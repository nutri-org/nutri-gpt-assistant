const express = require('express');
const { asyncHandler, createError } = require('../../middleware/error');
const openaiClient = require('../lib/openaiClient');
const { buildPrompt } = require('../lib/buildPrompt');
const { checkAllergenConflicts } = require('../lib/guardRails');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth(true));        // everything below this line is protected
router.use(validate);

router.post('/', asyncHandler(async (req, res) => {
  try {
    const { mode, messages, context } = req.body;

    // Default to meal_plan_strict if mode not provided
    const chatMode = mode || 'meal_plan_strict';

    // Build prompt based on mode
    const promptData = buildPrompt(chatMode, messages, context);

    // Call OpenAI
    const response = await openaiClient.completion(
      promptData.messages,
      promptData.temperature,
      promptData.functions
    );

    // Check for allergen/medication conflicts
    const guardCheck = checkAllergenConflicts(
      response.content, 
      context?.allergies, 
      context?.medications
    );

    if (!guardCheck.safe) {
      return res.status(422).json({ 
        error: guardCheck.violation,
        details: guardCheck.details 
      });
    }

    return res.json(response);

  } catch {
    // Let centralized error handler manage this
    throw createError(500, 'Failed to process chat request', 'UPSTREAM_ERROR');
  }
}));

module.exports = router;