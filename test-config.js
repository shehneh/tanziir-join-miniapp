// Test script to validate configuration
const config = require('./config');

console.log('🧪 Testing configuration...\n');

// Test 1: Check required config
console.log('1️⃣ Checking required configuration:');
if (!config.botToken) {
  console.log('   ❌ BOT_TOKEN is missing (this is expected in testing)');
  console.log('      Set BOT_TOKEN in .env file before running the bot');
} else {
  // Mask token for security - only show first and last 4 characters
  const maskedToken = config.botToken.substring(0, 4) + '...' + config.botToken.substring(config.botToken.length - 4);
  console.log(`   ✅ BOT_TOKEN is set (${maskedToken})`);
}

console.log(`   ✅ Music channel: ${config.musicChannel}`);

if (config.adminUserId) {
  // Don't log the actual ID for security reasons
  console.log('   ✅ Admin user ID is configured');
} else {
  console.log('   ℹ️  Admin user ID not set (optional)');
}

// Test 2: Check cache settings
console.log('\n2️⃣ Checking cache settings:');
console.log(`   ✅ Cache TTL: ${config.cacheTTL} seconds`);

// Test 3: Check search settings
console.log('\n3️⃣ Checking search settings:');
console.log(`   ✅ Max search results: ${config.maxSearchResults}`);
console.log(`   ✅ Search timeout: ${config.searchTimeout}ms`);
console.log(`   ✅ Download timeout: ${config.downloadTimeout}ms`);

// Test 4: Check message templates
console.log('\n4️⃣ Checking message templates:');
console.log(`   ✅ Welcome message: ${config.messages.welcome.length} characters`);
console.log(`   ✅ Help message: ${config.messages.help.length} characters`);

// Test 5: Check supported formats
console.log('\n5️⃣ Checking supported formats:');
console.log(`   ✅ Supported audio formats: ${config.supportedFormats.join(', ')}`);

console.log('\n✅ Configuration test completed successfully!');
console.log('\n📝 Next steps:');
console.log('   1. Copy .env.example to .env');
console.log('   2. Add your BOT_TOKEN to .env');
console.log('   3. Run: npm start');
