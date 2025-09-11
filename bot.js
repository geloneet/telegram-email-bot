require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

console.log('🚀 Iniciando GokuSYS...');

if (!process.env.TELEGRAM_TOKEN) {
    console.error('ERROR: No hay token de Telegram');
    process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// Función para verificar BIN con Binlist.net (GRATIS)
async function checkBIN(binNumber) {
    try {
        console.log('🔍 Verificando BIN:', binNumber);

        // Validar que el BIN tenga 6 dígitos
        if (!/^\d{6}$/.test(binNumber)) {
            throw new Error('El BIN debe tener exactamente 6 dígitos');
        }

        // Usar Binlist.net (GRATIS, no necesita API Key)
        const response = await axios.get(`https://lookup.binlist.net/${binNumber}`, {
            headers: {
                'Accept-Version': '3',
                'User-Agent': 'Telegram-BIN-Bot/1.0'
            },
            timeout: 10000
        });

        console.log('✅ Respuesta de Binlist.net:', response.status);
        return { success: true, data: response.data };

    } catch (error) {
        console.log('❌ Error en BIN check:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            return { 
                success: false, 
                error: 'BIN no encontrado en la base de datos' 
            };
        }
        
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `🤖 Bot GokuSYS

📋 Comandos disponibles:
/bin [6 dígitos] - Verificar información de tarjeta
/help - Ayuda e información
/status - Estado del bot

💡 Ejemplo: /bin 424242

🎯 20T`;
    
    bot.sendMessage(chatId, message);
});

// Comando /bin [número]
bot.onText(/\/bin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const binNumber = match[1].trim();
    
    console.log('📨 Comando /bin recibido:', binNumber);

    const progressMsg = await bot.sendMessage(chatId, 
        `🔍 Verificando BIN: ${binNumber}\n\n⏳ Consultando base de datos...`
    );

    try {
        const resultado = await checkBIN(binNumber);

        if (resultado.success) {
            const binData = resultado.data;
            
            let mensaje = `✅ INFORMACIÓN DE LA TARJETA\n\n`;
            mensaje += `🔢 BIN: ${binNumber}\n`;
            mensaje += `🏦 Banco: ${binData.bank?.name || 'No disponible'}\n`;
            mensaje += `📍 País: ${binData.country?.name || 'No disponible'} ${binData.country?.emoji || ''}\n`;
            mensaje += `💳 Tipo: ${binData.type || 'No disponible'}\n`;
            mensaje += `🔤 Marca: ${binData.scheme || 'No disponible'}\n`;
            
            if (binData.bank?.url) {
                mensaje += `🌐 Sitio web: ${binData.bank.url}\n`;
            }
            
            if (binData.bank?.phone) {
                mensaje += `📞 Teléfono: ${binData.bank.phone}\n`;
            }
            
            mensaje += `\n⏰ Consulta realizada: ${new Date().toLocaleString()}\n`;
            mensaje += `🎯 20T`;

            await bot.editMessageText(mensaje, {
                chat_id: chatId,
                message_id: progressMsg.message_id
            });

        } else {
            await bot.editMessageText(
                `❌ ERROR EN LA CONSULTA\n\n${resultado.error}\n\n💡 Asegúrate de que:\n• El BIN tenga 6 dígitos\n• El BIN sea válido\n\n🔍 Ejemplos: /bin 424242 o /bin 555555`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id
                }
            );
        }

    } catch (error) {
        await bot.editMessageText(
            `❌ ERROR INESPERADO\n\n${error.message}\n\n🔧 Intenta con otro BIN.`,
            {
                chat_id: chatId,
                message_id: progressMsg.message_id
            }
        );
    }
});

// Comando /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `❓ AYUDA - BIN CHECKER GRATIS

¿Qué es un BIN?
Los primeros 6 dígitos de una tarjeta identifican al banco emisor.

Ejemplos para probar:
• /bin 424242 (Visa prueba)
• /bin 555555 (Mastercard prueba)  
• /bin 378282 (American Express)
• /bin 601111 (Discover)
• /bin 353011 (JCB)


🔒 No almacenamos datos de tarjetas.`;
    
    bot.sendMessage(chatId, message);
});

// Comando /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    
    const statusMessage = `📊 ESTADO DEL BOT:

✅ Bot: Funcionando correctamente
⏰ Hora: ${new Date().toLocaleString()}
📈 Límite: 50,000 consultas/mes

💡 Usa: /bin 424242 para probar`;
    
    bot.sendMessage(chatId, statusMessage);
});

// Manejar mensajes no reconocidos
bot.on('message', (msg) => {
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, 
            '🤖 Usa /help para ver los comandos. Ejemplo: /bin 424242'
        );
    }
});

// Manejo de errores
bot.on('polling_error', (error) => {
    console.log('Error de polling:', error.code);
});

console.log('✅ Bot GokuSYS');