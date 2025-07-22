
const { getMealPlanSchema } = require('./schemas/mealPlan');

function buildPrompt(mode, messages, context = {}) {
  const { allergies = [], medications = [], goal = '' } = context;
  
  if (mode === 'goal_motivation') {
    return {
      messages: [
        {
          role: 'system',
          content: `You are an enthusiastic nutrition coach and motivational assistant. 
Your role is to provide encouraging, personalized motivation for users working toward their nutrition and health goals.

User's goal: ${goal}
${allergies.length > 0 ? `Allergies to avoid: ${allergies.join(', ')}` : ''}
${medications.length > 0 ? `Medications (be aware of interactions): ${medications.join(', ')}` : ''}

Be supportive, use emojis, and provide actionable encouragement. Keep responses conversational and uplifting.`
        },
        ...messages
      ],
      temperature: 0.7
    };
  }

  // Default to meal_plan_strict mode
  const systemPrompt = `You are a precise nutrition assistant that creates detailed meal plans.

STRICT REQUIREMENTS:
- You must provide exactly 4 meal categories: breakfast, lunch, dinner, snacks
- Each category must be an array of food items
- Each food item must include: food (string), calories (number), protein (number), carbs (number), fat (number)
- All nutritional values must be realistic and accurate

USER CONSTRAINTS:
${allergies.length > 0 ? `- AVOID these allergens: ${allergies.join(', ')}` : '- No known allergies'}
${medications.length > 0 ? `- Consider medication interactions: ${medications.join(', ')}` : '- No medications'}
- Goal: ${goal || 'general healthy eating'}

Provide a complete daily meal plan that meets these requirements exactly.`;

  const mealPlanFunction = {
    name: 'create_meal_plan',
    description: 'Create a structured daily meal plan',
    parameters: getMealPlanSchema()
  };

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.1,
    functions: [mealPlanFunction]
  };
}

module.exports = { buildPrompt };
