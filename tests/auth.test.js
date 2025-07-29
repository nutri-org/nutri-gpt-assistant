
/* eslint-env jest */
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const { app } = require('../server/server');

describe('auth middleware', () => {
  const good = jwt.sign({ id: 'u1', plan: 'free' }, process.env.JWT_SECRET);

  it('401 when missing token', () =>
    request(app).post('/api/chat').expect(401));

  it('200 when token valid', () =>
    request(app)
      .get('/api/healthz')
      .set('Authorization', `Bearer ${good}`)
      .expect(200));
});
