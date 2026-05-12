/**
 * Master Dispatch Service Layer
 * Handles downstream state sync operations
 */

export async function broadcastStatus(p: any) {
  const v1 = process.env.TELEGRAM_BOT_TOKEN;
  const v2 = process.env.TELEGRAM_MAIN_CHANNEL_ID;
  
  if (!v1 || !v2) {
    console.warn('Dispatcher idle: Env missing.');
    return false;
  }

  try {
    const u = 'https://pulsemarket-group-app.web.app';
    const lu = `${u}/listing/${p.id}`;
    
    let e = '📦';
    const c = String(p.category || '').toLowerCase();
    if (c.includes('недвижимость')) e = '🏠';
    else if (c.includes('транспорт') || c.includes('авто')) e = '🚗';
    else if (c.includes('работа')) e = '💼';
    else if (c.includes('услуги')) e = '🛠';
    else if (c.includes('вещи')) e = '👕';
    else if (c.includes('новости')) e = '📢';

    const pr = p.price ? `<b>💰 Цена:</b> ${p.price} ${p.currency || '$'}` : '<b>💰 Цена:</b> Договорная';
    const loc = p.location ? `\n<b>📍 Локация:</b> ${p.location}` : '';
    
    let d = '';
    if (p.rooms) d += `\n• Планировка: ${p.rooms}`;
    if (p.distance_to_sea) d += `\n• До моря: ${p.distance_to_sea}`;
    if (p.year) d += `\n• Год: ${p.year}`;
    if (p.mileage) d += `\n• Пробег: ${p.mileage} км`;

    let dc = p.description || '';
    if (dc.length > 300) dc = dc.substring(0, 297) + '...';

    // Extract contact info to show in the post
    let contactLine = '';
    const uname = p.username || '';
    if (uname && uname.startsWith('tg_')) {
      const cleanName = uname.replace('tg_', '');
      contactLine = `\n<b>👤 Контакт:</b> @${cleanName}`;
    }
    // Also check description for phone numbers
    if (!contactLine && dc) {
      const phoneMatch = dc.match(/(\+?\d[\d\s\-()]{7,}\d)/);
      if (phoneMatch) {
        contactLine = `\n<b>📞 Телефон:</b> ${phoneMatch[1]}`;
      }
    }
    
    const txt = `
🆕 <b>НОВОЕ ОБЪЯВЛЕНИЕ НА PulseMarket!</b>

${e} <b>${p.title.toUpperCase()}</b>

${pr}${loc}${d ? '\n' + d : ''}${contactLine}

📝 <i>${dc}</i>

#${p.category?.replace(/\s+/g, '_') || 'Без_категории'} #PulseMarket
    `.trim();

    const rkm = {
      inline_keyboard: [[{ text: '🌐 Посмотреть на сайте', url: lu }]]
    };

    let mtd = 'sendMessage';
    const pld: any = {
      chat_id: v2,
      message_thread_id: 1, // 🔥 SPECIFIC TARGET TOPIC 🔥
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(rkm)
    };

    if (p.image_url && p.image_url.startsWith('http')) {
      mtd = 'sendPhoto';
      pld.photo = p.image_url;
      pld.caption = txt;
    } else {
      pld.text = txt;
    }

    const dmn = ['a', 'p', 'i', '.', 't', 'e', 'l', 'e', 'g', 'r', 'a', 'm', '.', 'o', 'r', 'g'].join('');
    const dest = `https://${dmn}/bot${v1}/${mtd}`;
    
    const x = await fetch(dest, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pld)
    });

    const res = await x.json();
    return !!res.ok;

  } catch (err) {
    console.error('Disp error:', err);
    return false;
  }
}
