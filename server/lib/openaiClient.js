/* -------------------------------------------------------------------------- */
/*  server/lib/openaiClient.js                                                */
/* -------------------------------------------------------------------------- */

const OpenAI = require('openai');

class OpenAIClient {
  constructor() {
    /* ------------------------------------------------------------ *
     * 1. Resolve the key                                           *
     *    • Production / dev => OPENAI_API_KEY must be set          *
     *    • Test (NODE_ENV === "test") => use the stub "test-key"   *
     * ------------------------------------------------------------ */
    const apiKey =
      process.env.NODE_ENV === 'test'
        ? 'test-key'                       // <-- Jest & CI fallback
        : process.env.OPENAI_API_KEY?.trim();

    /* ------------------------------------------------------------ *
     * 2. Bail out early if we still have nothing.                  *
     * ------------------------------------------------------------ */
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is missing – set it in Replit or as a GitHub Actions secret.'
      );
    }

    /* ------------------------------------------------------------ *
     * 3. Construct the OpenAI SDK client.                          *
     * ------------------------------------------------------------ */
    this.client = new OpenAI({ apiKey });
  }

  /* ---------------------------------------------------------------------- *
   *  Chat‑completion thin wrapper with extra runtime safety.               *
   * ---------------------------------------------------------------------- */
  async completion(messages, temperature = 0.1, functions = null) {
    try {
      /** Base request body */
      const params = {
        model: 'gpt-3.5-turbo',
        messages,
        temperature,
      };

      /** Optional tool‑call */
      if (functions) {
        params.functions = functions;
        params.function_call = { name: functions[0].name };
      }

      const response = await this.client.chat.completions.create(params);

      /* ----------------------------- Defensive guards ----------------------------- */
      if (
        !response ||
        !Array.isArray(response.choices) ||
        response.choices.length === 0 ||
        !response.choices[0].message
      ) {
        console.error('Malformed OpenAI response:', JSON.stringify(response, null, 2));
        throw new Error('UPSTREAM_ERROR');
      }

      const { message } = response.choices[0];

      /* ------------------------- Structured function call ------------------------- */
      if (functions && message.function_call) {
        return {
          role: 'assistant',
          content: JSON.parse(message.function_call.arguments),
        };
      }

      /* -------------------------- Plain text completion --------------------------- */
      return {
        role: 'assistant',
        content: message.content,
      };
    } catch (err) {
      /* Bubble a single canonical error code for upstream handling / tests */
      console.error('OpenAI API error:', err);
      throw new Error('UPSTREAM_ERROR');
    }
  }
}

/* Export a **singleton** instance so callers do not need to instantiate. */
module.exports = new OpenAIClient();
