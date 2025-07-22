
const express = require('express');
const { getMealPlanSchema } = require('../lib/schemas/mealPlan');

const router = express.Router();

// Hard-coded responses for R1
const HARD_CODED_MEAL_PLAN = {
  breakfast: [
    {
      food: "Oatmeal with berries",
      calories: 300,
      protein: 8,
      carbs: 54,
      fat: 6
    }
  ],
  lunch: [
    {
      food: "Grilled chicken salad",
      calories: 450,
      protein: 35,
      carbs: 15,
      fat: 28
    }
  ],
  dinner: [
    {
      food: "Salmon with quinoa",
      calories: 520,
      protein: 40,
      carbs: 35,
      fat: 22
    }
  ],
  snacks: [
    {
      food: "Greek yogurt",
      calories: 150,
      protein: 15,
      carbs: 12,
      fat: 5
    }
  ]
};

const HARD_CODED_MOTIVATION = "Keep going! 💪 You're making great progress towards your nutrition goals. Every healthy choice counts!";

router.post('/chat', (req, res) => {
  try {
    const { mode, userId, messages, context } = req.body;
    
    // Default to meal_plan_strict if mode not provided
    const chatMode = mode || 'meal_plan_strict';
    
    if (chatMode === 'goal_motivation') {
      return res.json({
        role: 'assistant',
        content: HARD_CODED_MOTIVATION
      });
    } else {
      // Default to meal_plan_strict mode
      return res.json({
        role: 'assistant',
        content: HARD_CODED_MEAL_PLAN
      });
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
