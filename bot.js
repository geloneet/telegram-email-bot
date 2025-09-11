require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

console.log('🚀 Iniciando Bot con BIN Checker...');

// Verificar configuración
if (!process.env.TELEGRAM_TOKEN) {
    console.error('ERROR: No hay token de Telegram');
    process.exit(1);
}

if (!process.env.APILAYER_KEY) {
    console.log('Advertencia: No hay API Key de APILayer');
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// Función para verificar BIN
async function checkBIN(binNumber) {
    try {
        console.log('Verificando BIN:', binNumber);
        
        if (!process.env.APILAYER_KEY) {
            throw new Error('API Key no configurada. Revisa APILAYER_KEY en variables.');
        }

        // Validar que el BIN tenga 6 dígitos
        if (!/^\d{6}$/.test(binNumber)) {
            throw new Error('El BIN debe tener exactamente 6 dígitos');
        }

        const response = await axios.get(`https://api.apilayer.com/bincheck/${binNumber}`, {
            headers: {
                'apikey': process.env.APILAYER_KEY
            },
            timeout: 10000
        });

        console.log('Respuesta de BIN API:', response.status);
        return { success: true, data: response.data };

    } catch (error) {
        console.log('Error en BIN check:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
}

// Comando /start (SIN MARKDOWN)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `🤖 Bot BIN Checker Pro

📋 Comandos disponibles:
/bin [6 dígitos] - Verificar información de tarjeta
/help - Ayuda e información
/status - Estado del bot

💡 Ejemplo: /bin 424242

🔒 100% seguro y confidencial`;
    
    bot.sendMessage(chatId, message);
});

// Comando /bin [número] (SIN MARKDOWN)
bot.onText(/\/bin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const binNumber = match[1].trim();
    
    console.log('Comando /bin recibido:', binNumber);

    const progressMsg = await bot.sendMessage(chatId, 
        `🔍 Verificando BIN: ${binNumber}\n\n⏳ Consultando base de datos...`
    );

    try {
        const resultado = await checkBIN(binNumber);

        if (resultado.success) {
            const binData = resultado.data;
            
            // MENSAJE SIN MARKDOWN - SOLO TEXTO PLANO
            let mensaje = `✅ INFORMACIÓN DE LA TARJETA\n\n`;
            mensaje += `🔢 BIN: ${binNumber}\n`;
            mensaje += `🏦 Banco: ${binData.bank?.name || 'No disponible'}\n`;
            mensaje += `📍 País: ${binData.country?.name || 'No disponible'} ${binData.country?.emoji || ''}\n`;
            mensaje += `💳 Tipo: ${binData.type || 'No disponible'}\n`;
            mensaje += `🔤 Marca: ${binData.scheme || 'No disponible'}\n`;
            mensaje += `💰 Moneda: ${binData.currency || 'No disponible'}\n`;
            
            if (binData.bank?.url) {
                mensaje += `🌐 Sitio web: ${binData.bank.url}\n`;
            }
            
            if (binData.bank?.phone) {
                mensaje += `📞 Teléfono: ${binData.bank.phone}\n`;
            }
            
            mensaje += `\n📊 Datos adicionales:\n`;
            mensaje += `• Prepaid: ${binData.prepaid ? 'Sí' : 'No'}\n`;
            mensaje += `• Luhn Check: ${binData.luhn ? 'Válido' : 'Inválido'}\n`;
            
            mensaje += `\n⏰ Consulta realizada: ${new Date().toLocaleString()}`;

            await bot.editMessageText(mensaje, {
                chat_id: chatId,
                message_id: progressMsg.message_id
            });

        } else {
            await bot.editMessageText(
                `❌ ERROR EN LA CONSULTA\n\n${resultado.error}\n\n💡 Asegúrate de que:\n• El BIN tenga 6 dígitos\n• La API Key esté configurada\n• Tengas requests disponibles`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id
                }
            );
        }

    } catch (error) {
        await bot.editMessageText(
            `❌ ERROR INESPERADO\n\n${error.message}\n\n🔧 Contacta al administrador.`,
            {
                chat_id: chatId,
                message_id: progressMsg.message_id
            }
        );
    }
});

// Comando /help (SIN MARKDOWN)
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `❓ AYUDA - BIN CHECKER

¿Qué es un BIN?
El BIN (Bank Identification Number) son los primeros 6 dígitos de una tarjeta que identifican al banco emisor.

¿Cómo usar?
1. Encuentra los primeros 6 dígitos de una tarjeta
2. Usa: /bin 123456
3. Obtén información del banco

Ejemplos de BINs para probar:
• /bin 424242 (Visa prueba)
• /bin 555555 (Mastercard prueba)  
• /bin 378282 (American Express)

Importante:
• Solo uso educativo
• No almacenamos datos
• Consulta en tiempo real

Seguridad:
No compartas información sensible de tarjetas.`;
    
    bot.sendMessage(chatId, message);
});

// Comando /status (SIN MARKDOWN)
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    
    const statusMessage = `📊 ESTADO DEL BOT:

✅ Bot: Funcionando correctamente
⏰ Hora: ${new Date().toLocaleString()}
🔑 API Key: ${process.env.APILAYER_KEY ? 'Configurada' : 'No configurada'}

💡 Usa: /bin 424242 para probar`;
    
    bot.sendMessage(chatId, statusMessage);
});

// Manejar mensajes no reconocidos
bot.on('message', (msg) => {
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, 
            '🤖 Usa /help para ver los comandos disponibles. Ejemplo: /bin 424242'
        );
    }
});

// Manejo de errores
bot.on('polling_error', (error) => {
    console.log('Error de polling:', error.code);
});

console.log('✅ Bot BIN Checker iniciado correctamente');