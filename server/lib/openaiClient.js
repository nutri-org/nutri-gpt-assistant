
const OpenAI = require('openai');

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async completion(messages, temperature = 0.1, functions = null) {
    try {
      const params = {
        model: 'gpt-3.5-turbo',
        messages,
        temperature,
      };

      if (functions) {
        params.functions = functions;
        params.function_call = { name: functions[0].name };
      }

      const response = await this.client.chat.completions.create(params);
      
      // Defensive checks for malformed OpenAI responses
      if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error('OpenAI malformed response:', response);
        throw new Error('UPSTREAM_ERROR');
      }

      const choice = response.choices[0];
      if (!choice?.message) {
        console.error('OpenAI malformed response - missing choice or message:', response);
        throw new Error('UPSTREAM_ERROR');
      }

      if (functions && choice.message.function_call) {
        return {
          role: 'assistant',
          content: JSON.parse(choice.message.function_call.arguments)
        };
      }

      return {
        role: 'assistant',
        content: choice.message.content
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('UPSTREAM_ERROR');
    }
  }
}

module.exports = new OpenAIClient();
