\# replit\_backend\_plan\_v2.1.md

Nutri GPT Assistant · Replit Deployment Spec   &#x20;

— adds \*mode‑aware\* behaviour (strict vs creative)  

\---

\## 0 · Mission

Expose an HTTPS chat‑completion proxy with two runtime “personas”:

\| Mode                | Temperature | Output discipline                                    |

\|---------------------|-------------|------------------------------------------------------|

\| \`meal\_plan\_strict\`  | 0 ‑ 0.2     | Must respect allergy / medication constraints, emit \*\*valid JSON\*\* matching \`MealPlanSchema\`. |

\| \`goal\_motivation\`   | 0.7         | May be free‑form, motivational, use emojis, \*but\* must still avoid forbidden allergens / meds. |

Target traffic ≤ 600 req/day, ≤ 25 RPM, p99 ≤ 3 s.

\---

\## 1 · Tech Choices

\| Concern        | Decision                                                    |

\|----------------|-------------------------------------------------------------|

\| Runtime        | \*\*Node 18 + Express 4\*\*                                     |

\| Deployment     | Replit \*\*Autoscale\*\* (always‑on)                            |

\| Auth           | \`Authorization: Bearer GPT\_REPLIT\_TOKEN\` (checked middleware) |

\| Model client   | \`openai\@4\` (or OpenRouter wrapper)                          |

\| JSON schema    | Function‑calling (for strict mode) using \`MealPlanSchema\`   |

\| Guard rails    | Post‑response allergen & drug‑interaction checker           |

\| Repo source    | GitHub \`nutri-gpt-assistant\` (auto‑deploy)                  |

\---

\## 2 · Endpoint Contract (updated)

\*\*POST \`/api/chat\`\*\*

\`\`\`http

Host: https\://nutri-gpt-assistant-\<hash>.replit.app

Authorization: Bearer \<GPT\_REPLIT\_TOKEN>

Content-Type: application/json

Request body

{

&#x20; "mode": "meal\_plan\_strict" | "goal\_motivation",

&#x20; "userId": "uuid",

&#x20; "messages": [

&#x20;   { "role": "user", "content": "Hi" }

&#x20; ],

&#x20; "context": {

&#x20;   "allergies": ["peanuts", "shrimp"],

&#x20;   "medications": ["warfarin"],

&#x20;   "goal": "increase protein intake"

&#x20; }

}

★ If the top‑level "mode" field is omitted, the service must read the flag from the first system message ("mode:\<flag>").

Default = meal\_plan\_strict. ★

Success 200

{ "role": "assistant", "content": "..." }   // goal\_motivation

or for strict mode:

json

Copy

{

&#x20; "role": "assistant",

&#x20; "content": {

&#x20;   "breakfast": [ ... ],

&#x20;   "lunch":     [ ... ]

&#x20; }                        // valid MealPlanSchema

}

Errors

Code	Json body	Trigger

401	{ "error": "UNAUTHENTICATED" }	Missing / wrong bearer token

422	{ "error": "ALLERGEN\_CONFLICT" }	Guard‑rail post‑check fails

429	{ "error": "RATE\_LIMIT" }	Supabase gpt\_usage violation

500	{ "error": "UPSTREAM\_ERROR" }	OpenAI request failed / timed out

3 · Folder Tree (delta‑additions)

/server/

│  server.js # Express bootstrap

│

├─ routes/

│   └─ chat.js # implements /api/chat

│

├─ lib/

│   ├─ openaiClient.js # wraps OpenAI SDK

│   ├─ buildPrompt.js # chooses system prompt & temp per mode

│   ├─ guardRails.js # allergen / drug post‑check

│   └─ schemas/

│       └─ mealPlan.js # JSON schema / function definition

│

├─ middleware/

│   └─ auth.js # bearer‑token check

│

└─ package.json

/tests/

    chat.test.ts # unit tests incl. mode switching

README.md

.replit

.replit.nix

4 · Secrets & Config

Name	Scope	Notes

GPT\_REPLIT\_TOKEN	Replit Secrets → Supabase Vault	Shared bearer token; Supabase policy rate‑limits via gpt\_usage.

OPENAI\_API\_KEY	Replit Secrets	Model access

5 · CI / CD

GitHub → Replit Autoscale deployment.

Push to main auto‑deploys.

Tag releases gpt\_assistant\_vX.Y.

6 · Monitoring

Replit Deployment Logs for stdout/stderr.

GET /healthz returns { "status": "ok" } for uptime monitoring.

7 · Milestones & Gates (unchanged numbers, updated wording)

R#	Deliverable (pause‑for‑GO)	Gate

R1	Scaffold project + /api/chat returns hard‑coded JSON	curl -> 200

R2	OpenAI integration with mode switch & guardRails.js	unit test chat.test.ts green

R3	Auth middleware + Secrets Manager (GPT\_REPLIT\_TOKEN)	curl 401 vs 200

R4	Autoscale deployment live URL	Supabase invoke\_nutri\_gpt smoke test OK

R5	GET /healthz + README logging instructions	Final approval

8 · Done Criteria

Endpoint fulfils dual‑mode contract with JSON schema enforcement.

p99 ≤ 3 s at 25 RPM (Autoscale).

Guard‑rail denies allergen / med conflicts.

README shows curl example for each mode.

9 · Message script to Replit AI

(Only lines that changed vs v2.1 are shown.)

Message #1 — create project & R1

(identical to earlier script)

Message #2 — R2 (updated)

Implement Milestone R2:

• Replace hard‑coded reply with OpenAI completion.

• Accept body fields: mode, userId, messages, context.

• Apply buildPrompt.js logic:

  – mode === "meal\_plan\_strict": temp 0.1, strict system prompt, MealPlanSchema function‑call

  – mode === "goal\_motivation": temp 0.7, creative prompt, no schema

• Add guardRails.js post‑check for allergens & meds.

• Add /schemas/mealPlan.js defining the JSON schema + OpenAI function.

• Expand tests/chat.test.ts:

  · strict mode returns JSON

  · creative mode returns text

  · allergen violation triggers 422

Pause and wait for GO‑R2.

Subsequent messages unchanged.

What to update elsewhere?

Track	Change required?	Note

Lovable	No schema change. Document “mode inside first system prompt” in API docs during M3.&#x9;

Builder.io	When the chat component calls invoke\_nutri\_gpt, include "mode": "meal\_plan\_strict" or "goal\_motivation" or embed the flag as the first system message, plus the allergies / meds context.&#x9;

\:contentReference[oaicite:0]{index=0}