

import { AIModerationSettings } from '../types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ModerationResult {
  status: 'approved' | 'rejected' | 'pending';
  reason: string;
}

export async function moderateWithAI(
  content: string,
  title: string,
  settings: AIModerationSettings
): Promise<ModerationResult> {
  if (!settings.apiKey || !settings.autoModerationEnabled) {
    return { status: 'pending', reason: 'AI moderation disabled or API key not configured' };
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${settings.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Eternal MPG AI Moderation',
      },
      body: JSON.stringify({
        model: settings.model || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for the diplomatic platform "Eternal MPG".
Your task is to evaluate content for compliance with forum rules.

ALLOWED content:
- Diplomatic statements and declarations
- Discussion of economy, military affairs, crises
- UN resolutions and international agreements
- Role-playing in the style of geopolitical simulation
- Criticism of other states' actions (within diplomatic etiquette)

PROHIBITED content:
- Direct insults to participants
- Real-world violence threats
- Spam and meaningless text
- Content unrelated to forum topics
- Incitement of real ethnic hatred
- NSFW/explicit content

IMPORTANT: Respond STRICTLY in JSON format without markdown or additional text:
{"decision": "approve", "reason": "brief reason in Russian"}
or
{"decision": "reject", "reason": "brief reason in Russian"}`
          },
          {
            role: 'user',
            content: `Заголовок: ${title}\n\nСодержание:\n${content}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return { status: 'pending', reason: `API error: ${response.status}` };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      return { status: 'pending', reason: 'Empty response from AI' };
    }

    try {
      let jsonStr = aiResponse;
      
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      const jsonMatch = jsonStr.match(/\{[^}]+\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      
      if (parsed.decision === 'approve' || parsed.decision === 'reject') {
        return {
          status: parsed.decision === 'approve' ? 'approved' : 'rejected',
          reason: parsed.reason || 'AI moderation completed',
        };
      }
      
      const lowerResponse = aiResponse.toLowerCase();
      if (lowerResponse.includes('approve') || lowerResponse.includes('одобряю') || lowerResponse.includes('принять')) {
        return { status: 'approved', reason: 'Одобрено AI модератором' };
      }
      if (lowerResponse.includes('reject') || lowerResponse.includes('отклоняю') || lowerResponse.includes('отклонить')) {
        return { status: 'rejected', reason: 'Отклонено AI модератором' };
      }
      
      return { status: 'pending', reason: 'AI could not make a decision' };
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', aiResponse);
      
      const lowerResponse = aiResponse.toLowerCase();
      if (lowerResponse.includes('approve') || lowerResponse.includes('одобряю') || lowerResponse.includes('принять')) {
        return { status: 'approved', reason: 'Одобрено AI модератором' };
      }
      if (lowerResponse.includes('reject') || lowerResponse.includes('отклоняю') || lowerResponse.includes('отклонить')) {
        return { status: 'rejected', reason: 'Отклонено AI модератором' };
      }
      
      return { status: 'pending', reason: 'Failed to parse AI response' };
    }
  } catch (error) {
    console.error('AI Moderation error:', error);
    const errorMessage = (error as Error).message;
    
    // Provide more specific error messages
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return { status: 'pending', reason: 'Ошибка сети: не удалось подключиться к AI сервису. Проверьте интернет-соединение.' };
    }
    if (errorMessage.includes('non ISO-8859-1')) {
      return { status: 'pending', reason: 'Ошибка кодировки заголовков запроса. Обратитесь к администратору.' };
    }
    if (errorMessage.includes('CORS')) {
      return { status: 'pending', reason: 'Ошибка CORS: доступ к AI сервису заблокирован.' };
    }
    
    return { status: 'pending', reason: 'Ошибка соединения с AI: ' + errorMessage };
  }
}

export async function generateNewsWithAI(
  topic: string,
  settings: AIModerationSettings
): Promise<{ title: string; content: string } | null> {
  if (!settings.apiKey) return null;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${settings.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Eternal MPG News Generator',
      },
      body: JSON.stringify({
        model: settings.model || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a news editor for the diplomatic platform "Eternal MPG".
Create a news article for the "Platform News" section based on the given topic.

Response format STRICTLY JSON without markdown:
{"title": "news title in Russian", "content": "news content in 2-4 paragraphs in Russian"}

News must be:
- In the format of an official announcement
- In Russian language
- Informative and interesting
- Thematic for geopolitical role-playing game`
          },
          {
            role: 'user',
            content: `Topic: ${topic}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    if (!aiResponse) return null;

    let jsonStr = aiResponse;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    const parsed = JSON.parse(jsonStr.trim());
    if (parsed.title && parsed.content) {
      return { title: parsed.title, content: parsed.content };
    }
    return null;
  } catch (error) {
    console.error('AI Generation error:', error);
    return null;
  }
}

