# 🔍 راهنمای پیاده‌سازی جستجوی کانال

این فایل توضیح می‌دهد چگونه قابلیت جستجوی موسیقی در کانال تلگرام را پیاده‌سازی کنید.

## 📋 الزامات

برای پیاده‌سازی کامل جستجوی کانال، نیاز به موارد زیر دارید:

1. **دسترسی ادمین در کانال**: ربات باید به عنوان ادمین به کانال اضافه شود
2. **دیتابیس**: برای ذخیره و ایندکس کردن پیام‌های کانال
3. **سیستم ایندکس**: برای نمایه‌سازی و جستجوی سریع

## 🏗️ معماری پیشنهادی

### گزینه 1: ذخیره در فایل (ساده)

```javascript
const fs = require('fs');
const path = require('path');

// ساختار داده
const channelIndex = {
  messages: [],
  lastUpdate: null
};

// ذخیره پیام جدید
function indexMessage(message) {
  if (message.audio || message.voice || message.document) {
    channelIndex.messages.push({
      messageId: message.message_id,
      title: message.audio?.title || message.document?.file_name || 'Unknown',
      performer: message.audio?.performer || 'Unknown',
      caption: message.caption || '',
      fileId: message.audio?.file_id || message.voice?.file_id || message.document?.file_id,
      date: message.date
    });
    
    // ذخیره در فایل
    fs.writeFileSync('channel-index.json', JSON.stringify(channelIndex, null, 2));
  }
}

// جستجو در ایندکس
function searchInIndex(query) {
  const lowerQuery = query.toLowerCase();
  return channelIndex.messages.filter(msg => 
    msg.title.toLowerCase().includes(lowerQuery) ||
    msg.performer.toLowerCase().includes(lowerQuery) ||
    msg.caption.toLowerCase().includes(lowerQuery)
  );
}
```

### گزینه 2: استفاده از SQLite (توصیه می‌شود)

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('channel-music.db');

// ایجاد جدول
db.run(`
  CREATE TABLE IF NOT EXISTS music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER UNIQUE,
    title TEXT,
    performer TEXT,
    caption TEXT,
    file_id TEXT,
    date INTEGER,
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ذخیره پیام
function indexMessage(message) {
  if (message.audio) {
    db.run(`
      INSERT OR REPLACE INTO music (message_id, title, performer, caption, file_id, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      message.message_id,
      message.audio.title || 'Unknown',
      message.audio.performer || 'Unknown',
      message.caption || '',
      message.audio.file_id,
      message.date
    ]);
  }
}

// جستجو
function searchInDatabase(query, callback) {
  db.all(`
    SELECT * FROM music
    WHERE title LIKE ? OR performer LIKE ? OR caption LIKE ?
    ORDER BY date DESC
    LIMIT 10
  `, [`%${query}%`, `%${query}%`, `%${query}%`], callback);
}
```

### گزینه 3: استفاده از MongoDB (برای مقیاس بزرگ)

```javascript
const mongoose = require('mongoose');

// تعریف مدل
const MusicSchema = new mongoose.Schema({
  messageId: { type: Number, unique: true, required: true },
  title: { type: String, index: true },
  performer: { type: String, index: true },
  caption: { type: String },
  fileId: { type: String, required: true },
  date: { type: Date },
  indexedAt: { type: Date, default: Date.now }
});

// ایندکس متنی برای جستجوی بهتر
MusicSchema.index({ title: 'text', performer: 'text', caption: 'text' });

const Music = mongoose.model('Music', MusicSchema);

// ذخیره پیام
async function indexMessage(message) {
  if (message.audio) {
    await Music.findOneAndUpdate(
      { messageId: message.message_id },
      {
        title: message.audio.title || 'Unknown',
        performer: message.audio.performer || 'Unknown',
        caption: message.caption || '',
        fileId: message.audio.file_id,
        date: new Date(message.date * 1000)
      },
      { upsert: true, new: true }
    );
  }
}

// جستجو
async function searchInDatabase(query) {
  return await Music.find({
    $text: { $search: query }
  }).sort({ date: -1 }).limit(10);
}
```

## 🔄 ایندکس کردن خودکار

### روش 1: دریافت پیام‌های جدید

```javascript
// در bot.js اضافه کنید:
bot.on('channel_post', (message) => {
  // فقط پیام‌های کانال مورد نظر
  if (message.chat.username === MUSIC_CHANNEL.replace('@', '')) {
    indexMessage(message);
    console.log(`✅ Indexed: ${message.audio?.title || 'Unknown'}`);
  }
});
```

### روش 2: اسکن دوره‌ای کانال

```javascript
const cron = require('node-cron');

// هر 6 ساعت یکبار اسکن کن
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Starting channel scan...');
  await scanChannel();
});

async function scanChannel() {
  try {
    // دریافت پیام‌های کانال
    // توجه: نیاز به دسترسی ادمین دارد
    const updates = await bot.getUpdates();
    
    for (const update of updates) {
      if (update.channel_post) {
        await indexMessage(update.channel_post);
      }
    }
    
    console.log('✅ Channel scan completed');
  } catch (error) {
    console.error('❌ Error scanning channel:', error);
  }
}
```

## 📝 پیاده‌سازی در bot.js

برای استفاده از جستجوی کانال، تابع `searchInChannel` را به این شکل تغییر دهید:

```javascript
// در bot.js
const channelSearch = require('./services/channelSearch');

async function searchInChannel(query) {
  try {
    // جستجو در دیتابیس/ایندکس
    const results = await channelSearch.search(query);
    
    if (results.length > 0) {
      return results.map(result => ({
        channelId: MUSIC_CHANNEL,
        messageId: result.message_id,
        title: result.title,
        performer: result.performer,
        fileId: result.file_id
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching in channel:', error);
    return [];
  }
}
```

## 🚀 راه‌اندازی

### نصب وابستگی‌های اضافی:

برای SQLite:
```bash
npm install sqlite3
```

برای MongoDB:
```bash
npm install mongoose
```

برای cron jobs:
```bash
npm install node-cron
```

### اضافه کردن ربات به کانال:

1. به کانال بروید
2. Settings → Administrators → Add Administrator
3. ربات را انتخاب کنید
4. دسترسی "Post messages" و "Delete messages" را فعال کنید

## 💡 نکات مهم

1. **حریم خصوصی**: پیام‌های کانال عمومی را ذخیره کنید
2. **حجم داده**: برای کانال‌های بزرگ از دیتابیس استفاده کنید
3. **عملکرد**: از ایندکس‌های مناسب استفاده کنید
4. **بک‌آپ**: منظماً از دیتابیس بک‌آپ بگیرید
5. **محدودیت‌ها**: API تلگرام محدودیت در تعداد درخواست دارد

## 🔗 منابع مفید

- [Telegram Bot API - Working with Channels](https://core.telegram.org/bots/api#sendmessage)
- [SQLite in Node.js](https://www.sqlitetutorial.net/sqlite-nodejs/)
- [MongoDB with Mongoose](https://mongoosejs.com/docs/guide.html)
- [Full-Text Search in MongoDB](https://docs.mongodb.com/manual/text-search/)

## ❓ سوالات متداول

**Q: آیا ربات می‌تواند پیام‌های قبلی کانال را بخواند؟**
A: خیر، ربات فقط می‌تواند پیام‌های جدید (بعد از اضافه شدن به کانال) را دریافت کند.

**Q: چگونه پیام‌های قدیمی را ایندکس کنم؟**
A: باید از Telegram Client API استفاده کنید یا پیام‌ها را دستی ایندکس کنید.

**Q: آیا می‌توانم از متن پیام برای جستجو استفاده کنم؟**
A: بله، caption پیام‌ها می‌تواند شامل اطلاعات مفید باشد.

---

برای سوالات بیشتر، Issue ایجاد کنید یا در discussions شرکت کنید.
