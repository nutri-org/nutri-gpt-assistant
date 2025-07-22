
const request = require('supertest');
const app = require('../server/server');

// Mock OpenAI
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
      breakfast: [
        { food: "Oatmeal with berries", calories: 300, protein: 8, carbs: 54, fat: 6 }
      ],
      lunch: [
        { food: "Grilled chicken salad", calories: 450, protein: 35, carbs: 15, fat: 28 }
      ],
      dinner: [
        { food: "Salmon with quinoa", calories: 520, protein: 40, carbs: 35, fat: 22 }
      ],
      snacks: [
        { food: "Greek yogurt", calories: 150, protein: 15, carbs: 12, fat: 5 }
      ]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: 'create_meal_plan',
            arguments: JSON.stringify(mockMealPlan)
          }
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
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        functions: expect.any(Array)
      })
    );
  });

  test('should return 200 for goal_motivation mode with text response', async () => {
    const mockMotivation = "Keep going! 💪 You're making great progress towards your nutrition goals!";

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: mockMotivation
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
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        functions: undefined
      })
    );
  });

  test('should return 422 for allergen conflict', async () => {
    const mockMealPlanWithPeanuts = {
      breakfast: [
        { food: "Peanut butter toast", calories: 300, protein: 8, carbs: 54, fat: 6 }
      ],
      lunch: [
        { food: "Grilled chicken salad", calories: 450, protein: 35, carbs: 15, fat: 28 }
      ],
      dinner: [
        { food: "Salmon with quinoa", calories: 520, protein: 40, carbs: 35, fat: 22 }
      ],
      snacks: [
        { food: "Greek yogurt", calories: 150, protein: 15, carbs: 12, fat: 5 }
      ]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: 'create_meal_plan',
            arguments: JSON.stringify(mockMealPlanWithPeanuts)
          }
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
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

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
      breakfast: [{ food: "Oatmeal", calories: 300, protein: 8, carbs: 54, fat: 6 }],
      lunch: [{ food: "Chicken salad", calories: 450, protein: 35, carbs: 15, fat: 28 }],
      dinner: [{ food: "Salmon with quinoa", calories: 520, protein: 40, carbs: 35, fat: 22 }],
      snacks: [{ food: "Greek yogurt", calories: 150, protein: 15, carbs: 12, fat: 5 }]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: 'create_meal_plan',
            arguments: JSON.stringify(mockMealPlan)
          }
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
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.1,
        functions: expect.any(Array)
      })
    );
  });
});
