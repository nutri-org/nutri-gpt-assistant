
# Nutri-GPT Assistant Implementation Plan (Phase 1-4)

Based on audit findings and roadmap alignment, this document outlines the step-by-step implementation plan for bringing the Nutri-GPT assistant backend to production readiness.

## Overview

**Total Effort:** ~18 hours across 14 PRs
**Approach:** Small, incremental changes to avoid breaking existing functionality
**Priority:** Security foundations → Core features → Observability → Polish

---

## Phase 1 – Security Foundations (4.5 hours)

### PR-1: Restore CI Pipeline
**Goal:** Fix GitHub Actions workflow so CI runs on every push/PR  
**Files:** `.github/workflows/nodejs.yml`  
**Effort:** 15 minutes  
**Why:** Currently broken CI means no automated testing on commits

**Implementation:**
- Fix workflow triggers: `on: [push, pull_request]`
- Ensure Node.js version matches runtime (18+)
- Verify test command runs successfully

### PR-2: File Upload Security
**Goal:** Add file size/type validation to dataset upload endpoint  
**Files:** `routes/datasets.js`, `tests/datasets.test.js`  
**Effort:** 1 hour  
**Why:** Prevents malicious file uploads and resource exhaustion

**Implementation:**
- Add multer middleware with size limits (e.g., 10MB max)
- Restrict file types to safe formats (JSON, CSV)
- Add comprehensive test cases for edge cases

### PR-3: Stripe Webhook Security
**Goal:** Implement proper webhook signature verification  
**Files:** `routes/billing.js`, `tests/billing.test.js`  
**Effort:** 1.5 hours  
**Why:** Current webhook endpoint is vulnerable to spoofing

**Implementation:**
- Use `stripe.webhooks.constructEvent()` with signing secret
- Add test doubles for webhook verification
- Handle verification failures gracefully

### PR-4: Centralized Error Handling
**Goal:** Extract common JSON error handler and logger utility  
**Files:** `middleware/error.js`, `server.js`  
**Effort:** 1 hour  
**Why:** Consistent error responses and better debugging

**Implementation:**
- Create centralized error middleware
- Standardize error response format
- Add basic logging infrastructure

### PR-5: Rate Limiting
**Goal:** Implement rate limiter on chat endpoint  
**Files:** `middleware/rateLimit.js`, `tests/`  
**Effort:** 1 hour  
**Why:** Prevent abuse and ensure fair usage

**Implementation:**
- Memory-based rate limiting (Redis stub for future)
- Configurable limits per user/IP
- Proper error responses when limits exceeded

---

## Phase 2 – Roles, Quota, Billing (5 hours)

### PR-6: Admin RBAC System
**Goal:** Implement admin role-based access control  
**Files:** `middleware/auth.js`, database migration  
**Effort:** 2 hours  
**Why:** Critical security gap - admin endpoints currently unprotected

**Implementation:**
- Add `is_admin` boolean field to users table (default false)
- Update auth middleware to check admin status
- Protect `/api/datasets/upload` and `/api/settings` routes
- JWT should include admin claim

### PR-7: Stripe Checkout Integration
**Goal:** Add checkout session creation endpoint  
**Files:** `routes/billing.js`, tests  
**Effort:** 2 hours  
**Why:** Enable users to upgrade to paid plans

**Implementation:**
- `/api/billing/checkout` endpoint
- Create Stripe checkout sessions
- Handle success/cancel URLs
- Link sessions to user accounts

### PR-8: Quota Race Condition Fix
**Goal:** Fix concurrent quota consumption bug  
**Files:** `middleware/quota.js`, regression test  
**Effort:** 1 hour  
**Why:** Multiple requests can bypass quota limits

**Implementation:**
- Use atomic database operation: `UPDATE ... WHERE remaining_credits >= 1 RETURNING *`
- Add regression test for concurrent requests
- Proper error handling for quota exhaustion

---

## Phase 3 – Observability & Moderation (5 hours)

### PR-9: Logging & Error Tracking
**Goal:** Integrate Sentry and structured logging  
**Files:** `lib/logger.js`, error middleware  
**Effort:** 1 hour  
**Why:** Production apps need proper error tracking

**Implementation:**
- Sentry integration with DSN from environment
- Winston logger for structured logs
- Error reporting in centralized error handler

### PR-10: Content Moderation
**Goal:** Add OpenAI moderation to chat input/output  
**Files:** `lib/openaiClient.js`, `routes/chat.js`, tests  
**Effort:** 2 hours  
**Why:** Prevent harmful content and maintain platform safety

**Implementation:**
- OpenAI moderation API helper function
- Check user input before processing
- Check AI output before returning
- Proper error handling for moderation failures

### PR-11: Test Coverage
**Goal:** Achieve ≥90% test coverage  
**Files:** `tests/*`  
**Effort:** 2 hours  
**Why:** High coverage ensures code reliability

**Implementation:**
- Add missing edge case tests
- Set up `npm run coverage` command
- Focus on error paths and boundary conditions

---

## Phase 4 – Admin & Documentation (4 hours)

### PR-12: Admin Analytics API
**Goal:** Build admin dashboard endpoints  
**Files:** `routes/admin.js`, documentation  
**Effort:** 2 hours  
**Why:** Admins need usage analytics and credit management

**Implementation:**
- `/api/admin/analytics` - user metrics, usage stats
- `/api/admin/users/:id/credits` - credit adjustment endpoint
- Proper admin authorization on all endpoints
- Basic documentation

### PR-13: API Documentation
**Goal:** Generate OpenAPI spec  
**Files:** `scripts/genOAS.js`, documentation  
**Effort:** 1 hour  
**Why:** Developers need API documentation

**Implementation:**
- Use express-oas-generator for automatic spec generation
- Document all endpoints with examples
- Include authentication requirements

### PR-14: Documentation & Security Audit
**Goal:** Update README and run security checks  
**Files:** `README.md`, `docs/endpoint_examples.md`  
**Effort:** 1 hour  
**Why:** Complete documentation and security verification

**Implementation:**
- Update setup instructions
- Add endpoint examples
- Run `npm audit --production` for SBOM
- Document deployment process

---

## Implementation Guidelines

### Development Process
1. **One PR per goal** - Keep changes focused and reviewable
2. **Test-driven** - Write tests before implementation when possible
3. **Backward compatible** - Don't break existing functionality
4. **Environment-aware** - Use environment variables for configuration

### Security Priorities
1. **Admin RBAC** is critical - currently any authenticated user can access admin endpoints
2. **Input validation** on all user-facing endpoints
3. **Rate limiting** to prevent abuse
4. **Webhook verification** to prevent billing manipulation

### Quality Gates
- All tests must pass before merge
- ESLint must pass with no errors
- Manual testing of changed endpoints
- Security review for auth/billing changes

---

## Post-Phase 4 Considerations

After completing these 14 PRs, the backend will be production-ready. Future enhancements could include:

- **Industry extras:** Feature flags, GraphQL API, advanced analytics
- **Performance:** Redis for rate limiting, database query optimization
- **Monitoring:** Health checks, metrics dashboard, alerting
- **Scaling:** Load balancing, caching strategies

---

## Risk Mitigation

- **Rollback plan:** Each PR is small enough to revert quickly
- **Feature flags:** Consider feature toggles for major changes
- **Database migrations:** Always reversible with down scripts
- **Monitoring:** Set up basic health checks before production deployment

---

**Total Timeline:** 18 hours of development + testing + review
**Estimated Calendar Time:** 2-3 weeks with proper review cycles
