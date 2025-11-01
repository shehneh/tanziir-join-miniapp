require('dotenv').config();

module.exports = {
  // Bot configuration
  botToken: process.env.BOT_TOKEN,
  musicChannel: process.env.MUSIC_CHANNEL || '@tanziir',
  adminUserId: process.env.ADMIN_USER_ID,
  
  // Cache settings
  cacheTTL: 3600, // 1 hour in seconds
  
  // Search settings
  maxSearchResults: 5,
  searchTimeout: 10000, // 10 seconds
  downloadTimeout: 30000, // 30 seconds
  
  // Supported audio formats
  supportedFormats: ['.mp3', '.m4a', '.wav', '.flac'],
  
  // Message templates
  messages: {
    welcome: `
🎵 سلام! به ربات جستجوی موسیقی خوش آمدید

🔍 برای جستجوی موسیقی:
فقط کافیه نام آهنگ یا خواننده رو بفرستید

✨ قابلیت‌ها:
• جستجو در کانال
• در صورت عدم وجود، جستجو در اینترنت
• دانلود و ارسال موسیقی

📝 دستورات:
/start - شروع مجدد
/help - راهنما
/search <نام آهنگ> - جستجوی موسیقی

بفرما، اسم آهنگت رو بگو! 🎶
    `.trim(),
    
    help: `
📖 راهنمای استفاده از ربات

🔍 جستجوی موسیقی:
• فقط نام آهنگ یا خواننده رو بنویس
• مثال: "عماد طالب زاده"
• مثال: "دلم گرفته"

📢 نحوه کار ربات:
1️⃣ ابتدا در کانال جستجو می‌کنیم
2️⃣ اگر پیدا نشد، از اینترنت جستجو می‌کنیم
3️⃣ موسیقی برات ارسال می‌شه

💡 نکات:
• برای نتایج بهتر، نام دقیق آهنگ رو بنویس
• می‌تونی نام خواننده رو هم اضافه کنی

هر سوالی داشتی بپرس! 🎵
    `.trim()
  }
};
