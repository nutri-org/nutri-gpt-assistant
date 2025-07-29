
/* eslint-env jest */
import request from 'supertest';
import { app } from '../server/server.js';
import jwt from 'jsonwebtoken';

describe('auth middleware', () => {
  const good = jwt.sign({ id: 'u1', plan: 'free' }, process.env.JWT_SECRET);
  it('401 when missing token', () =>
    request(app).post('/api/chat').expect(401));
  it('200 when token valid', () =>
    request(app)
      .post('/api/healthz')
      .set('Authorization', `Bearer ${good}`)
      .expect(200));
});
