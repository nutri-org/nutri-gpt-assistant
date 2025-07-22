
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
      
      if (functions && response.choices[0].message.function_call) {
        return {
          role: 'assistant',
          content: JSON.parse(response.choices[0].message.function_call.arguments)
        };
      }

      return {
        role: 'assistant',
        content: response.choices[0].message.content
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('UPSTREAM_ERROR');
    }
  }
}

module.exports = new OpenAIClient();
