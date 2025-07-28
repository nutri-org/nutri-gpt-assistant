
# Nutri‑GPT Assistant

A Node.js Express API that delivers personalised nutrition guidance and meal plans with OpenAI.  
It checks allergen conflicts and medication interactions before replying.

---

## Quick Start (local)

```bash
git clone https://github.com/nutri-org/nutri-gpt-assistant.git
cd nutri-gpt-assistant
npm ci
# supply your OpenAI secret as an env var the first time you run
export OPENAI_API_KEY=sk‑•••
PORT=5000 npm start
