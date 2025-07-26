
# Preview Port Mismatch Issue

**Date**: 2025-01-22  
**Severity**: Medium  
**Status**: Fixed  

## Symptom
- Preview tab shows "We couldn't reach this app"
- Server startup fails with `SyntaxError: Unexpected identifier 'a'`
- Tests inconsistent due to port handling

## Root Cause
1. **Syntax Error**: Comment text was appearing as code in `server/server.js`
2. **Port Configuration**: Server not consistently using `process.env.PORT`
3. **Missing Root Route**: No basic endpoint for Preview tab health check

## Fix Applied
1. **Fixed Syntax**: Removed malformed comment from server.js
2. **Port Handling**: Ensured `process.env.PORT || 5000` usage
3. **Root Route**: Added `GET /` returning `{status: "ok"}` for Preview
4. **Replit Config**: Updated `.replit` entrypoint to `server/server.js`

## Prevention
- Always test syntax after file edits
- Use environment variables for all port configurations
- Include basic health check routes for deployment readiness

## Verification
```bash
npm start  # Should start without syntax errors
curl localhost:5000/  # Should return {"status":"running"}
```
