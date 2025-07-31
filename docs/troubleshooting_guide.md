
# Troubleshooting Guide: nutri-gpt-assistant Project Issues & Resolutions

**Date Created:** January 2025  
**Project:** nutri-gpt-assistant  
**Environment:** Replit + Node.js + Jest + ESLint

## Table of Contents
1. [ESLint v9 Migration Issues](#eslint-v9-migration-issues)
2. [Jest Test Suite Failures](#jest-test-suite-failures)
3. [Mock Implementation Problems](#mock-implementation-problems)
4. [Preview Port Configuration Issues](#preview-port-configuration-issues)
5. [Lint Errors and Code Quality](#lint-errors-and-code-quality)
6. [Timeout Issues in Tests](#timeout-issues-in-tests)

---

## ESLint v9 Migration Issues

### Problem
- Legacy ESLint configuration was incompatible with v9
- `eslint-plugin-node` package was deprecated and not v9-compatible
- Flat config format required complete restructuring

### Symptoms
```bash
npm run lint
# Error: Plugin "eslint-plugin-node" is not compatible with ESLint v9
```

### Root Cause
ESLint v9 introduced breaking changes requiring:
- Migration from `.eslintrc.js` to flat config (`eslint.config.mjs`)
- Replacement of deprecated plugins
- New syntax for configuration structure

### Resolution Applied
1. **Replaced deprecated plugins:**
   - `eslint-plugin-node` → `eslint-plugin-n` (v9-ready fork)
   
2. **Migrated to flat config:**
   - Created `eslint.config.mjs` with proper ES module syntax
   - Used `FlatCompat` to convert legacy Jest configurations
   - Implemented proper rule inheritance and conflict prevention

3. **Final configuration structure:**
```javascript
export default [
  { ignores: ["eslint.config.mjs"] },
  js.configs.recommended,
  nPlugin.configs["flat/recommended"],
  ...compat.config(jestPlugin.configs.recommended),
  prettier, // Last to prevent conflicts
  // Test-specific globals
  // Project-specific rules
];
```

### Prevention
- Always check plugin compatibility before major ESLint updates
- Use migration guides and compatibility tools
- Test configuration changes incrementally

---

## Jest Test Suite Failures

### Problem
Jest tests were failing due to mock implementation issues and file parsing errors.

### Symptoms
```bash
npm test
# Multiple test failures across different suites
# Mock functions not being called correctly
# Real modules executing instead of mocks
```

### Root Cause Analysis
1. **Mock Hoisting Issues:** Jest mocks were placed after module imports, causing real modules to execute first
2. **File Content Corruption:** Markdown artifacts accidentally injected into test files
3. **Mock Implementation Gaps:** Incomplete mock functions causing runtime errors

### Resolution Applied

#### 1. Mock Hoisting (R2 fix-suite)
**Problem:** Real `openaiClient.js` was executing despite mocks
**Solution:** Moved all `jest.mock()` calls to the very top of test files

```javascript
// BEFORE (broken)
const request = require('supertest');
const app = require('../server/app');
jest.mock('../server/lib/openaiClient'); // Too late!

// AFTER (working)
jest.mock('../server/lib/openaiClient', () => ({
  completion: jest.fn().mockResolvedValue({ role: 'assistant', content: { dummy: true } })
}));
const request = require('supertest');
const app = require('../server/app');
```

#### 2. File Content Cleanup
**Problem:** Markdown text corrupting JavaScript test files
**Solution:** Removed all non-JavaScript content from test files

#### 3. Mock Implementation Completion
**Problem:** Incomplete mock return values
**Solution:** Ensured all mocked functions return proper data structures

### Prevention
- Always place `jest.mock()` calls at the very top of test files
- Keep test files purely JavaScript - no embedded documentation
- Verify mock implementations match expected return types

---

## Mock Implementation Problems

### Problem
Test mocks were not properly simulating real module behavior, causing test failures.

### Symptoms
- `TypeError: Cannot read property 'choices' of undefined`
- Mock functions returning incomplete data structures
- Tests expecting specific response formats failing

### Root Cause
Mocks were returning simplified objects that didn't match the expected API response structure.

### Resolution Applied

#### OpenAI Client Mock
```javascript
// BEFORE (broken)
jest.mock('../server/lib/openaiClient', () => ({
  completion: jest.fn().mockResolvedValue('Simple string response')
}));

// AFTER (working)
jest.mock('../server/lib/openaiClient', () => ({
  completion: jest.fn().mockResolvedValue({
    role: 'assistant',
    content: { dummy: true }
  })
}));
```

#### Supabase Mock Chain
```javascript
// Proper promise chain simulation
jest.mock('../server/lib/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSingle
      }))
    }))
  })),
  rpc: mockRpc
}));
```

### Prevention
- Study real API responses before creating mocks
- Test mock implementations in isolation
- Use TypeScript or JSDoc for better type checking

---

## Preview Port Configuration Issues

### Problem
Replit Preview tab showing "We couldn't reach this app" with server startup failures.

### Symptoms
```bash
# Server startup error
SyntaxError: Unexpected identifier 'a'
# Preview tab connection failures
```

### Root Cause
1. **Syntax Errors:** Malformed comments in server files
2. **Port Binding:** Server not using `process.env.PORT`
3. **Missing Health Check:** No basic endpoint for preview verification

### Resolution Applied

#### 1. Fixed Syntax Errors
Removed corrupted comment blocks from `server/server.js`

#### 2. Proper Port Configuration
```javascript
// Ensure consistent port usage
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
});
```

#### 3. Added Health Check Route
```javascript
// Basic endpoint for preview verification
app.get('/', (req, res) => {
  res.json({ status: 'running' });
});
```

### Prevention
- Always test server startup after file modifications
- Use environment variables for all port configurations
- Include basic health check routes for deployment readiness

---

## Lint Errors and Code Quality

### Problem
ESLint reporting various code quality issues after migration.

### Symptoms
```bash
npm run lint
# Multiple "no-unused-vars" errors
# Undefined variables in test files
```

### Root Cause
1. **Unused Variables:** Variables declared but never used
2. **Missing Global Declarations:** Jest globals not properly configured
3. **Import/Require Inconsistencies:** Mixed module systems

### Resolution Applied

#### 1. Removed Unused Variables
```javascript
// BEFORE
const supabase = require('../server/lib/supabase'); // Never used
const mockAuth = jest.fn(); // Never used

// AFTER
// Variables removed entirely
```

#### 2. Configured Jest Globals
```javascript
// In eslint.config.mjs
{
  files: ["**/*.test.js"],
  languageOptions: {
    globals: {
      jest: "readonly",
      describe: "readonly",
      test: "readonly",
      expect: "readonly"
    }
  }
}
```

#### 3. Standardized Error Handling
```javascript
// BEFORE
} catch (error) { // 'error' never used
  res.status(500).json({ error: 'Internal server error' });
}

// AFTER  
} catch {
  res.status(500).json({ error: 'Internal server error' });
}
```

### Prevention
- Run `npm run lint` frequently during development
- Configure IDE to show ESLint warnings in real-time
- Use meaningful variable names and remove unused code promptly

---

## Timeout Issues in Tests

### Problem
Individual tests hitting Jest's 15,000ms timeout limit.

### Symptoms
```bash
# Each test taking excessive time
# Tests eventually timing out or hanging
```

### Root Cause
1. **Real Network Calls:** Tests making actual HTTP requests instead of using mocks
2. **Async/Await Issues:** Promises not being properly handled
3. **Server Lifecycle:** Test servers not being properly cleaned up

### Resolution Applied

#### 1. Proper Test Server Management
```javascript
describe('Test Suite', () => {
  let server;
  
  afterEach(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      server = null;
    }
  });
});
```

#### 2. Complete Mock Coverage
Ensured all external dependencies are mocked to prevent real network calls.

#### 3. Timeout Configuration
```javascript
// In jest.setup.js if needed
jest.setTimeout(10000); // Reasonable timeout for unit tests
```

### Prevention
- Mock all external dependencies
- Properly manage test server lifecycle
- Monitor test execution times regularly

---

## Summary & Best Practices

### Key Lessons Learned
1. **Mock Placement Matters:** Jest mocks must be hoisted to the top of files
2. **File Purity:** Keep test files purely JavaScript, documentation separate
3. **Complete Mocking:** Mock implementations must match expected data structures
4. **Environment Configuration:** Use environment variables for all configurable values
5. **Incremental Testing:** Test changes frequently and incrementally

### Recommended Development Workflow
1. Run `npm run lint` before committing
2. Run `npm test` to verify all tests pass
3. Check server startup with `npm start`
4. Verify Preview tab accessibility
5. Document any new issues in this guide

### Tools & Commands for Debugging
```bash
# Quick health check
npm run lint && npm test && npm start

# Detailed test output
npm test -- --verbose

# ESLint with auto-fix
npm run lint -- --fix

# Check server startup
curl localhost:5000/
```

This document should be updated whenever new issues are encountered and resolved to maintain a comprehensive troubleshooting reference.
