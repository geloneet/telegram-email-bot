require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

console.log('🚀 Iniciando Bot BIN Checker PRO...');

if (!process.env.TELEGRAM_TOKEN) {
    console.error('ERROR: No hay token de Telegram');
    process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// Función mejorada para verificar BIN con categoría
async function checkBIN(binNumber) {
    try {
        console.log('🔍 Verificando BIN:', binNumber);

        if (!/^\d{6}$/.test(binNumber)) {
            throw new Error('El BIN debe tener exactamente 6 dígitos');
        }

        // PRIMERA OPCIÓN: Binlist.com.br (mejor categoría)
        try {
            const response = await axios.get(`https://binlist.com.br/api/bin/${binNumber}`, {
                timeout: 8000
            });

            if (response.data && response.data.status === 'success') {
                console.log('✅ Usando Binlist.com.br');
                return { 
                    success: true, 
                    data: response.data.data,
                    source: 'Binlist.com.br' 
                };
            }
        } catch (error) {
            console.log('⚠️  Binlist.com.br no disponible, intentando con Binlist.net...');
        }

        // SEGUNDA OPCIÓN: Binlist.net (fallback)
        const response = await axios.get(`https://lookup.binlist.net/${binNumber}`, {
            headers: {
                'Accept-Version': '3',
                'User-Agent': 'Telegram-BIN-Bot/1.0'
            },
            timeout: 8000
        });

        console.log('✅ Usando Binlist.net');
        return { 
            success: true, 
            data: response.data,
            source: 'Binlist.net' 
        };

    } catch (error) {
        console.log('❌ Error en BIN check:', error.message);
        
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
    
    const message = `🤖 *Bot BIN Checker PRO* 🚀

📋 *Comandos disponibles:*
/bin [6 dígitos] - Verificar tarjeta con categoría
/help - Ayuda e información  
/status - Estado del bot

💡 *Ejemplo:* /bin 424242

🎯 *Ahora con:* ✅ Categoría ✅ Tipo ✅ Nivel ✅ País
🔒 *Totalmente GRATIS* - Sin API Key`;
    
    bot.sendMessage(chatId, message);
});

// Comando /bin [número] MEJORADO
bot.onText(/\/bin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const binNumber = match[1].trim();
    
    console.log('📨 Comando /bin recibido:', binNumber);

    const progressMsg = await bot.sendMessage(chatId, 
        `🔍 Verificando BIN: ${binNumber}\n\n⏳ Consultando bases de datos...`
    );

    try {
        const resultado = await checkBIN(binNumber);

        if (resultado.success) {
            const binData = resultado.data;
            const source = resultado.source;
            
            let mensaje = `✅ *INFORMACIÓN COMPLETA DE LA TARJETA*\n\n`;
            mensaje += `🔢 *BIN:* ${binNumber}\n`;
            mensaje += `🏦 *Banco:* ${binData.bank?.name || binData.bank || 'No disponible'}\n`;
            mensaje += `📍 *País:* ${binData.country?.name || binData.country || 'No disponible'} ${binData.country?.emoji || ''}\n`;
            
            // CATEGORÍA Y TIPO (lo más importante)
            mensaje += `💳 *Tipo:* ${binData.type || 'No disponible'}\n`;
            mensaje += `📊 *Categoría:* ${binData.category || binData.scheme || 'No disponible'}\n`;
            
            // INFORMACIÓN ADICIONAL DE Binlist.com.br
            if (binData.level) {
                mensaje += `⭐ *Nivel:* ${binData.level}\n`;
            }
            
            if (binData.brand) {
                mensaje += `🔤 *Marca:* ${binData.brand}\n`;
            }
            
            if (binData.currency) {
                mensaje += `💰 *Moneda:* ${binData.currency}\n`;
            }
            
            if (binData.bank?.url) {
                mensaje += `🌐 *Sitio web:* ${binData.bank.url}\n`;
            }
            
            if (binData.bank?.phone) {
                mensaje += `📞 *Teléfono:* ${binData.bank.phone}\n`;
            }
            
            mensaje += `\n⏰ *Consulta realizada:* ${new Date().toLocaleString()}\n`;
            mensaje += `🎯 *Fuente:* ${source}\n`;
            mensaje += `📈 *Límite:* Consultas ilimitadas`;

            await bot.editMessageText(mensaje, {
                chat_id: chatId,
                message_id: progressMsg.message_id
            });

        } else {
            await bot.editMessageText(
                `❌ *ERROR EN LA CONSULTA*\n\n${resultado.error}\n\n💡 *Ejemplos válidos:*\n• /bin 424242 (Visa)\n• /bin 555555 (Mastercard)\n• /bin 378282 (Amex)\n• /bin 601111 (Discover)`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id
                }
            );
        }

    } catch (error) {
        await bot.editMessageText(
            `❌ *ERROR DE CONEXIÓN*\n\n${error.message}\n\n🔧 *Intenta con:*\n/bin 424242\n/bin 555555\n/bin 378282`,
            {
                chat_id: chatId,
                message_id: progressMsg.message_id
            }
        );
    }
});

// Comando /help mejorado
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `❓ *AYUDA - BIN CHECKER PRO* 🚀

*¿Qué información muestra?*
✅ Categoría de la tarjeta
✅ Tipo (Crédito/Débito)  
✅ Nivel (Classic/Gold/Platinum)
✅ País y banco emisor
✅ Marca (Visa/Mastercard/Amex)
✅ Datos de contacto del banco

*Ejemplos para probar:*
• /bin 424242 (Visa Classic)
• /bin 555555 (Mastercard Standard)  
• /bin 378282 (Amex Gold)
• /bin 491748 (Visa Platinum)
• /bin 601111 (Discover)

*🔒 Totalmente GRATIS:*
• Sin API Key requerida
• Sin registro necesario  
• Sin límites estrictos

*🎯 Fuentes utilizadas:*
• Binlist.com.br (1000/día)
• Binlist.net (fallback)`;
    
    bot.sendMessage(chatId, message);
});

// Comando /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    
    const statusMessage = `📊 *ESTADO DEL BOT - BIN CHECKER PRO* 🚀

✅ *Bot:* Funcionando al 100%
⏰ *Hora:* ${new Date().toLocaleString()}
🎯 *API:* Binlist.com.br + Binlist.net
📈 *Límite:* 1000+ consultas/día
💡 *Ejemplo:* /bin 424242

*✨ Características:*
• ✅ Categoría de tarjeta
• ✅ Tipo y nivel  
• ✅ País y banco
• ✅ Múltiples fuentes
• ✅ Respuesta rápida`;
    
    bot.sendMessage(chatId, statusMessage);
});

// Comando /ejemplos
bot.onText(/\/ejemplos/, (msg) => {
    const chatId = msg.chat.id;
    
    const ejemplos = `🎯 *BINs DE PRUEBA CON CATEGORÍA* 📊

*💳 Visa:*
• /bin 424242 - Classic (EEUU)
• /bin 491748 - Platinum (México)  
• /bin 453998 - Gold (España)

*💳 Mastercard:*
• /bin 555555 - Standard (EEUU)
• /bin 522222 - World Elite (Canadá)
• /bin 545454 - Gold (Reino Unido)

*💳 American Express:*
• /bin 378282 - Gold (EEUU)
• /bin 371449 - Platinum (Canadá)

*💳 Otras:*
• /bin 601111 - Discover (EEUU)
• /bin 353011 - JCB (Japón)
• /bin 362272 - Diners Club (México)

*🔍 ¡Pruébalos todos!*`;
    
    bot.sendMessage(chatId, ejemplos);
});

// Manejar mensajes no reconocidos
bot.on('message', (msg) => {
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, 
            '🤖 Usa /help para ver comandos. Ejemplo: /bin 424242'
        );
    }
});

// Manejo de errores
bot.on('polling_error', (error) => {
    console.log('Error de polling:', error.code);
});

console.log('✅ Bot GOKUSYS iniciado correctamente');