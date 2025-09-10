require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('🔍 Probando bot simple...');
console.log('Token existe:', !!process.env.TELEGRAM_TOKEN);

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log('✅ Recibido /start de:', chatId);
    bot.sendMessage(chatId, '🎉 ¡Bot funcionando!');
});

console.log('🤖 Bot simple iniciado');