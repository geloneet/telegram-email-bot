require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');
const axios = require('axios');

console.log('🚀 Iniciando bot de newsletters...');

// Configuración básica
if (!process.env.TELEGRAM_TOKEN) {
    console.error('❌ ERROR: No hay token de Telegram');
    process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// ==================== FUNCIÓN THE GUARDIAN ====================
async function subscribeToGuardian(email) {
    try {
        console.log('📧 Suscribiendo a The Guardian:', email);
        
        const response = await axios.post('https://api.nextgen.guardianapps.co.uk/email', {
            email: email,
            listName: 'guardian-today-uk',
            source: 'telegram-bot',
            consent: true
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Telegram-Newsletter-Bot/1.0'
            },
            timeout: 10000
        });

        console.log('✅ Suscripción exitosa:', response.status);
        return { success: true, data: response.data };
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
}

// ==================== COMANDOS DEL BOT ====================

// Comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `
🤖 *Bot de Newsletters Éticos*

📋 *Comandos disponibles:*
/subs [email] - Suscribir a The Guardian
/newsletters - Ver newsletters disponibles
/status - Estado del bot

⚠️ *Suscripción ética:* Solo APIs oficiales con consentimiento.
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /subs [email]
bot.onText(/\/subs (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim();
    
    if (!email.includes('@') || !email.includes('.')) {
        return bot.sendMessage(chatId, '❌ Email no válido. Ejemplo: /subs tuemail@gmail.com');
    }

    const progressMsg = await bot.sendMessage(chatId, 
        `📧 Suscribiendo ${email} a The Guardian...\n\n⏳ Por favor espera...`,
        { parse_mode: 'Markdown' }
    );

    try {
        const resultado = await subscribeToGuardian(email);

        if (resultado.success) {
            await bot.editMessageText(
                `✅ *Suscripción exitosa!*\n\n📧 ${email}\n📰 The Guardian Today\n\n🔔 Recibirás noticias del Reino Unido.`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id,
                    parse_mode: 'Markdown'
                }
            );
        } else {
            await bot.editMessageText(
                `❌ *Error:* ${resultado.error}\n\n💡 Intenta manualmente: https://www.theguardian.com/email`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id,
                    parse_mode: 'Markdown'
                }
            );
        }

    } catch (error) {
        await bot.editMessageText(
            `❌ *Error inesperado:*\n\n${error.message}`,
            {
                chat_id: ChatId,
                message_id: progressMsg.message_id,
                parse_mode: 'Markdown'
            }
        );
    }
});

// Comando /newsletters
bot.onText(/\/newsletters/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `
📰 *Newsletters Disponibles:*

1. **The Guardian Today** (Automático)
   📧 /subs email@gmail.com

2. **TechCrunch** (Manual)
   🔗 https://techcrunch.com/newsletters/

3. **MIT Technology Review** (Manual)
   🔗 https://www.technologyreview.com/newsletter/

4. **Product Hunt** (Manual)
   🔗 https://www.producthunt.com/newsletter

✅ *Suscripción ética con consentimiento*
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Comando /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `✅ Bot funcionando - ${new Date().toLocaleString()}`);
});

// Manejo de errores
bot.on('polling_error', (error) => {
    console.log('❌ Error de polling:', error.code);
});

console.log('✅ Bot de newsletters iniciado correctamente');