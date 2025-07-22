
const request = require('supertest');
const app = require('../server/server');

describe('POST /api/chat', () => {
  test('should return 200 for meal_plan_strict mode', async () => {
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

  test('should return 200 for goal_motivation mode', async () => {
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

  test('should default to meal_plan_strict when mode is not provided', async () => {
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
