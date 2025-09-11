require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('🚀 Iniciando bot SUPER simple...');
console.log('⏰ Hora:', new Date().toLocaleString());

// Verificar que existe el token
if (!process.env.TELEGRAM_TOKEN) {
    console.error('❌ ERROR: No hay token de Telegram');
    console.log('💡 Verifica en Railway → Variables → TELEGRAM_TOKEN');
    process.exit(1);
}

console.log('✅ Token encontrado, iniciando bot...');

// Crear el bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// Mensaje cuando el bot se inicia
bot.on('polling_error', (error) => {
    console.log('❌ Error de polling:', error.code);
});

// Comando /start - MUY SIMPLE
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log('✅ Recibido /start de chat ID:', chatId);
    
    bot.sendMessage(chatId, '🎉 ¡BOT FUNCIONANDO! \n\nEscribe /hola o /hora');
});

// Comando /hola
bot.onText(/\/hola/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '¡Hola! 👋 \n\n¡Sí funciona el bot!');
    console.log('✅ Respondido /hola');
});

// Comando /hora
bot.onText(/\/hora/, (msg) => {
    const chatId = msg.chat.id;
    const hora = new Date().toLocaleTimeString();
    bot.sendMessage(chatId, `🕐 Hora del servidor: ${hora}`);
    console.log('✅ Respondido /hora');
});

// Responder a cualquier mensaje que no sea comando
bot.on('message', (msg) => {
    if (!msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, '🤖 Escribe /start para comenzar');
        console.log('✅ Respondido a mensaje normal');
    }
});

console.log('✅ Bot SUPER simple iniciado correctamente');
console.log('📱 Busca tu bot en Telegram y escribe /start');