import * as functions from 'firebase-functions';

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateText(
  prompt: string,
  options: AICompletionOptions = {}
): Promise<string> {
  // Check functions config first (firebase functions:config:set), then env var for CI
  const apiKey = functions.config().ai?.openai_key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured — set via firebase functions:config:set ai.openai_key=...');
  }

  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 500;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate wellness guide helping users with daily guidance, life planning, and emotional support.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    return content;
  } catch (error) {
    functions.logger.error('AI generation error:', { error, prompt: prompt.substring(0, 100) });
    throw error;
  }
}

export async function generateDailyGuidance(context?: string): Promise<{ message: string; affirmation?: string; action?: string }> {
  const prompt = `Generate a short, uplifting daily guidance message${
    context ? ` based on this context: ${context}` : ''
  }. Include:
1. A main message (1-2 sentences)
2. An affirmation (optional, 1 sentence)
3. A suggested action for today (optional, 1 sentence)

Format as JSON with keys: message, affirmation, action`;

  const response = await generateText(prompt, { maxTokens: 300 });

  try {
    const parsed = JSON.parse(response);
    return {
      message: parsed.message || response,
      affirmation: parsed.affirmation,
      action: parsed.action,
    };
  } catch {
    return { message: response };
  }
}

export async function generateBlueprint(context?: string): Promise<{ title: string; summary: string; sections: Array<{ title: string; content: string }> }> {
  const prompt = `Create a personal blueprint/life plan${
    context ? ` based on this context: ${context}` : ''
  }. Include:
1. A title for the blueprint
2. A brief summary
3. 3-4 sections with titles and content

Format as JSON with keys: title, summary, sections (array of {title, content})`;

  const response = await generateText(prompt, { maxTokens: 1000 });

  try {
    const parsed = JSON.parse(response);
    return {
      title: parsed.title || 'Personal Blueprint',
      summary: parsed.summary || '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    };
  } catch {
    return {
      title: 'Personal Blueprint',
      summary: response,
      sections: [],
    };
  }
}

export async function generateChatReply(message: string, context?: string): Promise<string> {
  const prompt = `Respond helpfully and empathetically to this message: "${message}"${
    context ? `. Context: ${context}` : ''
  }. Keep response concise (1-3 sentences).`;

  return generateText(prompt, { maxTokens: 200 });
}
