
// Jest global setup – executed before every test file
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Make fetch / supertest time‑out deterministic (no open handles)
jest.setTimeout(10000);
