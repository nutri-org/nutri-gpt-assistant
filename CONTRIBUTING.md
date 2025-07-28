
# Contributing to nutri-gpt-assistant

## Development Workflow

### Branching Strategy
- **Work directly on `main`** for most changes
- Only create short feature branches if a change will break tests for more than 1 day
- Feature branches should be merged back to `main` as soon as tests pass

### Milestone Management
- All milestones are tagged (e.g., `gpt_assistant_v1.0`, `gpt_assistant_v2.1`)
- **Never rewrite history on `main` after a tag is published**
- Tags represent stable release points

### Testing Requirements
- All unit tests in `tests/chat.test.js` must pass before merging
- Run `npm test` to verify test suite passes
- Fix any failing tests immediately or revert changes

### Code Quality
- Follow existing code patterns and structure
- Keep changes focused and atomic
- Document any breaking changes or new features

### Deployment
- GitHub → Replit Autoscale deployment
- Push to `main` triggers auto-deployment
- Use Replit deployment tools exclusively

## Getting Started
1. Clone the repository
2. Run `npm install`
3. Run `npm test` to verify setup
4. Run `npm start` to start development server on port 5000

## Project Structure
- `server/` - Express backend with routes and business logic
- `tests/` - Jest unit tests
- `docs/` - Project documentation
- `attached_assets/` - Development artifacts and context files
