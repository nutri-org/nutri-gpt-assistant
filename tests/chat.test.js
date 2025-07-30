jest.mock('../server/lib/openaiClient', () => ({
  completion: jest.fn()
}));

const openaiClient = require('../server/lib/openaiClient');
const app          = require('../server/app');        // pure app, no server

process.env.AUTH_TOKEN = 'test-secret-token';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

// Mock guardRails after the main imports
jest.mock('../server/lib/guardRails', () => ({
  checkAllergenConflicts: jest.fn()
}));

const { checkAllergenConflicts } = require('../server/lib/guardRails');

const secret    = process.env.JWT_SECRET;
const goodToken = jwt.sign({ id: 'u1', plan: 'free' }, secret);

describe('POST /api/chat', () => {

  /** ensure a clean slate & a default "safe" guard‑rail result */
  beforeEach(() => {
    checkAllergenConflicts.mockReturnValue({ safe: true });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ───────────────────────── meal_plan_strict (200 / JSON)
  test('should return 200 for meal_plan_strict mode with structured response', async () => {
    const mockMealPlan = {
      breakfast: [{ food: 'Oats', calories: 200 }],
      lunch:      [],
      dinner:     [],
      snacks:     []
    };
    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: mockMealPlan
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({
        mode:       'meal_plan_strict',
        userId:     'test-user',
        messages:   [{ role: 'user', content: 'Give me a meal plan' }],
        context:    { allergies: [], medications: [], goal: 'maintain weight' }
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('assistant');
    ['breakfast','lunch','dinner','snacks'].forEach(k =>
      expect(res.body.content).toHaveProperty(k));
  });

  // ───────────────────────── goal_motivation (200 / text)
  test('should return 200 for goal_motivation mode with text response', async () => {
    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: 'Stay strong and keep going!'
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({
        mode:     'goal_motivation',
        userId:   'test-user',
        messages: [{ role: 'user', content: 'Motivate me!' }],
        context:  { goal: 'lose weight' }
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('assistant');
    expect(typeof res.body.content).toBe('string');
    expect(res.body.content.length).toBeGreaterThan(0);
  });

  // ───────────────────────── allergen conflict (422)
  test('should return 422 for allergen conflict', async () => {
    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: {
        breakfast: [{ food: 'Peanut butter toast', calories: 300 }],
        lunch: [], dinner: [], snacks: []
      }
    });

    checkAllergenConflicts.mockReturnValue({
      safe: false,
      violation: 'ALLERGEN_CONFLICT',
      details: 'Contains peanuts'
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({
        mode:       'meal_plan_strict',
        userId:     'test-user',
        messages:   [{ role: 'user', content: 'Give me a meal plan' }],
        context:    { allergies: ['peanuts'], medications: [], goal: 'maintain weight' }
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('ALLERGEN_CONFLICT');
  });

  // ───────────────────────── upstream error (500)
  test('should return 500 for OpenAI API failure', async () => {
    openaiClient.completion.mockRejectedValue(new Error('UPSTREAM_ERROR'));

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({
        mode:       'meal_plan_strict',
        userId:     'test-user',
        messages:   [{ role: 'user', content: 'Give me a meal plan' }],
        context:    { allergies: [], medications: [], goal: 'maintain weight' }
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('UPSTREAM_ERROR');
  });

  // ───────────────────────── default mode (200 / JSON)
  test('should default to meal_plan_strict when mode is not provided', async () => {
    const mockMealPlan = {
      breakfast: [{ food: 'Oats', calories: 200 }],
      lunch: [], dinner: [], snacks: []
    };
    openaiClient.completion.mockResolvedValue({
      role: 'assistant',
      content: mockMealPlan
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({
        userId:   'test-user',
        messages: [{ role: 'user', content: 'Help me' }]
      });

    expect(res.status).toBe(200);
    expect(res.body.content).toHaveProperty('breakfast');
  });

  // ---- bad‐request validation (400) ---------------------------------
  test('should return 400 when messages array is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${goodToken}`)
      .send({ userId: 'test-user' }); // no messages

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });
});

afterAll(() => {
  jest.clearAllMocks();
});