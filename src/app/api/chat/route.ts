import { NextResponse } from 'next/server';

// Простой in-memory rate-limiter по userId
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Rate Limiting (Изоляция от спама: 15 запросов в минуту)
    const now = Date.now();
    const limit = rateLimits.get(userId) || { count: 0, resetAt: now + 60000 };
    if (now > limit.resetAt) {
      limit.count = 0;
      limit.resetAt = now + 60000;
    }
    limit.count++;
    rateLimits.set(userId, limit);

    if (limit.count > 15) {
      return NextResponse.json({ reply: 'Вы отправляете сообщения слишком часто. Пожалуйста, подождите минуту.' });
    }

    // Подготовка промпта (Системный контекст)
    const systemPrompt = `Ты — дружелюбный ИИ-консультант и техническая поддержка маркетплейса PulseMarket (Северный Кипр). 
Твои задачи:
1. Отвечать на вопросы пользователей по сайту (как выложить объявление, как работает Telegram-бот).
2. Помогать с поиском квартир, авто или услуг.
3. Быть вежливым, кратким и профессиональным. Не используй длинные введения.

Сайт PulseMarket: это платформа бесплатных объявлений на Северном Кипре.
Телеграм-бот: @BotHelpG_bot (для верификации, публикации постов, техподдержки).
Оплата: Telegram Stars используются в боте для закрепления объявлений и премиум-подписок.`;

    // Convert generic chat history to Gemini format (role must strictly alternate starting with user)
    const geminiContents = [];
    
    // Внедряем системный промпт и ответ модели как начало диалога для обратной совместимости с API v1
    geminiContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    geminiContents.push({
      role: 'model',
      parts: [{ text: 'Я понял! Я ИИ-консультант PulseMarket. Готов помогать пользователям.' }]
    });

    // Отфильтруем приветственные сообщения ассистента в самом начале, чтобы начать диалог с user
    let startIndex = 0;
    while (startIndex < messages.length && (messages[startIndex].role === 'assistant' || messages[startIndex].role === 'system')) {
      startIndex++;
    }
    const activeMessages = messages.slice(startIndex);

    for (const msg of activeMessages) {
      if (msg.role === 'system') continue;
      const currentRole = msg.role === 'assistant' ? 'model' : 'user';
      
      // Если роли дублируются подряд (например, два user сообщения), объединяем их для валидности Gemini API
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === currentRole) {
        geminiContents[geminiContents.length - 1].parts[0].text += "\n" + msg.content;
      } else {
        geminiContents.push({
          role: currentRole,
          parts: [{ text: msg.content }]
        });
      }
    }

    if (geminiContents.length === 2) { // Только системный промпт и его подтверждение
      return NextResponse.json({ reply: 'Чем я могу вам помочь?' });
    }

    // Получаем ключ
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing');
      return NextResponse.json({ reply: 'Простите, сейчас у меня технические неполадки (API ключ не настроен).' });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API Error:', res.status, errorText);
      return NextResponse.json({ reply: 'Извините, возникла ошибка связи с ИИ. Обратитесь к @BotHelpG_bot в Telegram.' });
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не удалось получить ответ.';

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({ reply: 'Произошла ошибка при обработке запроса.' }, { status: 500 });
  }
}
