import * as functions from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';

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

    // Strip markdown code fences if model accidentally includes them
    return content.replace(/```[\s\S]*?```/g, '').trim();
  } catch (error) {
    functions.logger.error('AI generation error:', { error, prompt: prompt.substring(0, 100) });
    throw error;
  }
}

export async function generateDailyGuidance(
  blueprintSummary?: string,
  focusAreas?: string[],
  tonePref?: string
): Promise<{ message: string; affirmation?: string; action?: string; mission?: any; patternToWatch?: string; strengthToUse?: string }> {
  const blueprintText = blueprintSummary ? `Blueprint: ${blueprintSummary}` : '';
  const focusText = focusAreas?.length ? `Focus areas: ${focusAreas.join(', ')}.` : '';
  const toneText = tonePref ? `Tone: ${tonePref}.` : '';

  const prompt = `${blueprintText} ${focusText} ${toneText}

Generate today's guidance. Include:
1. Main message (1-2 sentences)
2. Affirmation (1 sentence)
3. Suggested action (1 sentence)
4. Pattern to watch (emotional insight, 1 sentence)
5. Strength to use (1 sentence)
6. One small mission (title, description, difficulty, estimatedMinutes)

ONLY respond with valid JSON (no markdown):
{
  "message": "string",
  "affirmation": "string",
  "action": "string",
  "patternToWatch": "string",
  "strengthToUse": "string",
  "mission": {
    "title": "string",
    "description": "string",
    "difficulty": "easy|medium|hard",
    "estimatedMinutes": number
  }
}`;

  const response = await generateText(prompt, { maxTokens: 800 });

  try {
    const parsed = JSON.parse(response);
    return {
      message: parsed.message || 'Take a moment for yourself today.',
      affirmation: parsed.affirmation,
      action: parsed.action,
      patternToWatch: parsed.patternToWatch,
      strengthToUse: parsed.strengthToUse,
      mission: parsed.mission ? { id: uuidv4(), ...parsed.mission } : undefined,
    };
  } catch {
    return { message: response };
  }
}

export async function generateBlueprint(
  name: string,
  focusAreas?: string[],
  emotionalGoal?: string,
  seferYetzirahInsight?: string
): Promise<{ title: string; summary: string; sections: Array<{ title: string; content: string }> }> {
  const focusText = focusAreas?.length ? `Focus areas: ${focusAreas.join(', ')}.` : '';
  const goalText = emotionalGoal ? `Current emotional goal: ${emotionalGoal}.` : '';
  const syText = seferYetzirahInsight ? `Deeper guidance (Sefer Yetzirah): ${seferYetzirahInsight}` : '';

  const prompt = `Create a personal blueprint for ${name}. ${focusText} ${goalText} ${syText}

Generate a personalized blueprint with:
1. A title reflecting their direction
2. A brief, warm summary (2-3 sentences)
3. 3-4 sections: strengths, growth areas, daily practices, guidance style

ONLY respond with valid JSON (no markdown):
{
  "title": "string",
  "summary": "string",
  "sections": [
    {"title": "string", "content": "string"}
  ]
}`;

  const response = await generateText(prompt, { maxTokens: 1200 });

  try {
    const parsed = JSON.parse(response);
    return {
      title: parsed.title || `${name}'s Blueprint`,
      summary: parsed.summary || '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    };
  } catch {
    return {
      title: `${name}'s Blueprint`,
      summary: response,
      sections: [],
    };
  }
}

export async function generateChatReply(
  userMessage: string,
  blueprintSummary?: string,
  dailyGuidance?: string,
  memorySummary?: string,
  tonePref?: string
): Promise<string> {
  const contextParts = [];
  if (blueprintSummary) contextParts.push(`Blueprint: ${blueprintSummary}`);
  if (dailyGuidance) contextParts.push(`Today: ${dailyGuidance}`);
  if (memorySummary) contextParts.push(`Memory: ${memorySummary}`);
  if (tonePref) contextParts.push(`Tone: ${tonePref}`);

  const contextText = contextParts.length ? `Context:\n${contextParts.join('\n')}\n\n` : '';

  const prompt = `${contextText}Respond warmly and concisely to: "${userMessage}"

Be a warm mentor. Keep response to 1-3 sentences. One practical next step if helpful. No markdown code fences.`;

  return generateText(prompt, { maxTokens: 400 });
}
