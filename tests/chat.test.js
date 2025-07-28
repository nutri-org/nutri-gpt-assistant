
// --- jest mocks (hoisted) ---------------------------------
jest.mock('../server/lib/openaiClient', () => ({
  // the route expects { role, content } already unwrapped
  completion: jest.fn().mockResolvedValue({ role: 'assistant', content: { dummy: true } })
}));

jest.mock('../server/lib/guardRails', () => ({
  checkAllergenConflicts: jest.fn().mockReturnValue({ safe: true })
}));
// -----------------------------------------------------------

const request = require('supertest');
const app = require('../server/server');
const openaiClient = require('../server/lib/openaiClient');
const { checkAllergenConflicts } = require('../server/lib/guardRails');

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 for meal_plan_strict mode with structured response', async () => {
    const mockMealPlan = {
      breakfast: [{ food: 'Oats', calories: 200 }],
      lunch: [],
      dinner: [],
      snacks: []
    };

    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: mockMealPlan
    });

    const response = await request(app)
      .post('/api/chat')
      .send({
        mode: 'meal_plan_strict',
        userId: 'test-user',
        messages: [{ role: 'user', content: 'Give me a meal plan' }],
        context: {
          allergies: [],
          medications: [],
          goal: 'maintain weight'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('assistant');
    expect(response.body.content).toHaveProperty('breakfast');
    expect(response.body.content).toHaveProperty('lunch');
    expect(response.body.content).toHaveProperty('dinner');
    expect(response.body.content).toHaveProperty('snacks');
  });

  test('should return 200 for goal_motivation mode with text response', async () => {
    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: 'Stay strong and keep going!'
    });

    const response = await request(app)
      .post('/api/chat')
      .send({
        mode: 'goal_motivation',
        userId: 'test-user',
        messages: [{ role: 'user', content: 'Motivate me!' }],
        context: {
          goal: 'lose weight'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('assistant');
    expect(typeof response.body.content).toBe('string');
    expect(response.body.content.length).toBeGreaterThan(0);
  });

  test('should return 422 for allergen conflict', async () => {
    const mockMealPlan = {
      breakfast: [{ food: 'Peanut butter toast', calories: 300 }],
      lunch: [],
      dinner: [],
      snacks: []
    };

    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: mockMealPlan
    });

    checkAllergenConflicts.mockReturnValue({
      safe: false,
      violation: 'ALLERGEN_CONFLICT',
      details: 'Contains peanuts'
    });

    const response = await request(app)
      .post('/api/chat')
      .send({
        mode: 'meal_plan_strict',
        userId: 'test-user',
        messages: [{ role: 'user', content: 'Give me a meal plan' }],
        context: {
          allergies: ['peanuts'],
          medications: [],
          goal: 'maintain weight'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('ALLERGEN_CONFLICT');
  });

  test('should return 500 for OpenAI API failure', async () => {
    openaiClient.completion.mockRejectedValue(new Error('UPSTREAM_ERROR'));

    const response = await request(app)
      .post('/api/chat')
      .send({
        mode: 'meal_plan_strict',
        userId: 'test-user',
        messages: [{ role: 'user', content: 'Give me a meal plan' }],
        context: {
          allergies: [],
          medications: [],
          goal: 'maintain weight'
        }
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('UPSTREAM_ERROR');
  });

  test('should default to meal_plan_strict when mode is not provided', async () => {
    const mockMealPlan = {
      breakfast: [{ food: 'Oats', calories: 200 }],
      lunch: [],
      dinner: [],
      snacks: []
    };

    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: mockMealPlan
    });

    const response = await request(app)
      .post('/api/chat')
      .send({
        userId: 'test-user',
        messages: [{ role: 'user', content: 'Help me' }]
      });

    expect(response.status).toBe(200);
    expect(response.body.content).toHaveProperty('breakfast');
  });
});
