const TelegramBot = require('node-telegram-bot-api');
const NodeCache = require('node-cache');
const config = require('./config');
const { searchMusic, downloadAudio } = require('./services/musicSearch');

// Configuration
const BOT_TOKEN = config.botToken;
const MUSIC_CHANNEL = config.musicChannel;
const ADMIN_USER_ID = config.adminUserId;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Cache for channel messages
const messageCache = new NodeCache({ stdTTL: config.cacheTTL });

console.log('🤖 Bot started successfully!');
console.log(`📢 Monitoring channel: ${MUSIC_CHANNEL}`);

// Welcome message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, config.messages.welcome);
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, config.messages.help);
});

// Search command handler
bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const searchQuery = match[1];
  await handleMusicSearch(chatId, searchQuery);
});

// Handle text messages as search queries
bot.on('message', async (msg) => {
  // Ignore commands
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  // Only process text messages
  if (msg.text) {
    const chatId = msg.chat.id;
    const searchQuery = msg.text;
    await handleMusicSearch(chatId, searchQuery);
  }
});

// Main music search handler
async function handleMusicSearch(chatId, query) {
  try {
    // Send searching message
    const searchingMsg = await bot.sendMessage(
      chatId, 
      `🔍 در حال جستجوی "${query}"...\nلطفا صبر کنید...`
    );
    
    // Step 1: Search in channel
    console.log(`🔍 Searching for "${query}" in channel ${MUSIC_CHANNEL}`);
    const channelResults = await searchInChannel(query);
    
    if (channelResults && channelResults.length > 0) {
      await bot.editMessageText(
        `✅ پیدا شد! در حال ارسال از کانال...`,
        { chat_id: chatId, message_id: searchingMsg.message_id }
      );
      
      // Forward the first result
      await forwardChannelMusic(chatId, channelResults[0]);
      
      // If multiple results, show options
      if (channelResults.length > 1) {
        await bot.sendMessage(
          chatId,
          `📝 ${channelResults.length - 1} نتیجه دیگر هم پیدا شد.\nاگر این آهنگ مورد نظرت نبود، جستجوی دقیق‌تری انجام بده.`
        );
      }
      return;
    }
    
    // Step 2: Search on internet
    console.log(`🌐 Searching for "${query}" on internet`);
    await bot.editMessageText(
      `❌ در کانال پیدا نشد.\n🌐 در حال جستجو در اینترنت...`,
      { chat_id: chatId, message_id: searchingMsg.message_id }
    );
    
    const internetResults = await searchOnInternet(query);
    
    if (internetResults && internetResults.length > 0) {
      await bot.editMessageText(
        `✅ در اینترنت پیدا شد! در حال آماده‌سازی برای دانلود...`,
        { chat_id: chatId, message_id: searchingMsg.message_id }
      );
      
      // Send music info with download options
      await sendInternetMusicResults(chatId, internetResults);
      return;
    }
    
    // Nothing found
    await bot.editMessageText(
      `❌ متاسفانه موسیقی "${query}" پیدا نشد.\n\n💡 پیشنهادات:\n• نام آهنگ رو دقیق‌تر بنویس\n• نام خواننده رو اضافه کن\n• املای فارسی رو چک کن`,
      { chat_id: chatId, message_id: searchingMsg.message_id }
    );
    
  } catch (error) {
    console.error('❌ Error in music search:', error);
    bot.sendMessage(
      chatId,
      `⚠️ خطایی رخ داد. لطفا دوباره تلاش کنید.\n\nاگر مشکل ادامه داشت، به ادمین گزارش بدید.`
    );
    
    // Notify admin if configured
    if (ADMIN_USER_ID) {
      bot.sendMessage(
        ADMIN_USER_ID,
        `⚠️ Error in search for "${query}":\n${error.message}`
      ).catch(err => console.error('Failed to notify admin:', err));
    }
  }
}

// Search in Telegram channel
async function searchInChannel(query) {
  try {
    // In a real implementation, you would need to:
    // 1. Have the bot as admin in the channel to read messages
    // 2. Store channel messages in a database or cache
    // 3. Search through stored messages
    
    // For now, we'll return a simulated search
    // This is a placeholder - actual implementation would require:
    // - Bot needs to be admin in the channel
    // - Indexing channel messages periodically
    // - Searching through indexed messages
    
    console.log(`⚠️ Channel search is not fully implemented yet`);
    console.log(`   To implement: Make bot admin in ${MUSIC_CHANNEL} and index messages`);
    
    return []; // Return empty array for now
  } catch (error) {
    console.error('Error searching in channel:', error);
    return [];
  }
}

// Forward music from channel
async function forwardChannelMusic(chatId, messageInfo) {
  try {
    // Forward the message from channel to user
    await bot.forwardMessage(chatId, messageInfo.channelId, messageInfo.messageId);
    
    // Send additional info
    await bot.sendMessage(
      chatId,
      `✅ موسیقی از کانال ${MUSIC_CHANNEL} ارسال شد.\n\n🎵 از کانال ما دیدن کنید: ${MUSIC_CHANNEL}`
    );
  } catch (error) {
    console.error('Error forwarding music:', error);
    throw error;
  }
}

// Search music on internet (using free APIs)
async function searchOnInternet(query) {
  try {
    return await searchMusic(query);
  } catch (error) {
    console.error('Error searching on internet:', error);
    return [];
  }
}

// Send internet music results
async function sendInternetMusicResults(chatId, results) {
  try {
    const firstResult = results[0];
    
    // Create result message
    let message = `🎵 نتیجه جستجو:\n\n`;
    message += `🎤 ${firstResult.title}\n`;
    message += `👤 ${firstResult.artist}\n`;
    if (firstResult.album) {
      message += `💿 ${firstResult.album}\n`;
    }
    
    // Send music info
    await bot.sendMessage(chatId, message);
    
    // If preview is available, try to send it
    if (firstResult.previewUrl) {
      try {
        message += `\n⬇️ در حال دانلود پیش‌نمایش...`;
        
        // Download and send audio preview
        const audioStream = await downloadAudio(firstResult.previewUrl);
        
        // Send as audio (stream is used directly)
        await bot.sendAudio(chatId, audioStream, {
          caption: `🎵 ${firstResult.title} - ${firstResult.artist}\n\n⚠️ این فایل پیش‌نمایش 30 ثانیه‌ای است.\nبرای دانلود کامل از منابع قانونی استفاده کنید.`
        });
        
      } catch (downloadError) {
        console.error('Error downloading preview:', downloadError);
        
        // Send link instead
        await bot.sendMessage(
          chatId,
          `🔗 لینک پیش‌نمایش:\n${firstResult.previewUrl}\n\n💡 روی لینک کلیک کنید تا موسیقی پخش شود.`
        );
      }
    }
    
    // Show more results if available
    if (results.length > 1) {
      let moreResults = `\n📋 نتایج دیگر:\n`;
      for (let i = 1; i < Math.min(results.length, 5); i++) {
        moreResults += `\n${i + 1}. ${results[i].title} - ${results[i].artist}`;
      }
      await bot.sendMessage(chatId, moreResults);
    }
    
  } catch (error) {
    console.error('Error sending internet results:', error);
    throw error;
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});
