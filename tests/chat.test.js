
const request = require('supertest');
const app = require('../server/server');

// Mock OpenAI client
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

const OpenAI = require('openai');
const mockOpenAI = new OpenAI();

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

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: JSON.stringify(mockMealPlan)
        }
      }]
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
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Stay strong and keep going!'
        }
      }]
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

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: JSON.stringify(mockMealPlan)
        }
      }]
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
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('UPSTREAM_ERROR'));

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

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: JSON.stringify(mockMealPlan)
        }
      }]
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
