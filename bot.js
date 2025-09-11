// Función mejorada para suscripción a newsletters
async function subscribeToNewsletter(email, service = 'guardian') {
    try {
        console.log('📧 Intentando suscripción a:', service, 'para:', email);

        if (service === 'guardian') {
            // Método alternativo para The Guardian
            const response = await axios.get('https://www.theguardian.com/email', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            // Simular que se procesó la solicitud
            console.log('✅ Página de suscripción accesible');
            return {
                success: true,
                message: 'Visita https://www.theguardian.com/email para completar la suscripción',
                manualUrl: 'https://www.theguardian.com/email',
                email: email
            };
        }

    } catch (error) {
        console.log('❌ Error accediendo al newsletter:', error.message);
        return {
            success: false,
            error: 'No se pudo automatizar. Usa el link manual.',
            manualUrl: 'https://www.theguardian.com/email'
        };
    }
}

// Comando /subs mejorado
bot.onText(/\/subs (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim();
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return bot.sendMessage(chatId, '❌ Email no válido. Ejemplo: /subs tuemail@gmail.com');
    }

    const progressMsg = await bot.sendMessage(chatId, 
        `📧 Procesando suscripción para: ${email}\n\n⏳ Verificando opciones...`,
        { parse_mode: 'Markdown' }
    );

    try {
        const resultado = await subscribeToNewsletter(email, 'guardian');

        if (resultado.success) {
            await bot.editMessageText(
                `✅ *Procesado correctamente!*\n\n` +
                `📧 *Email:* ${email}\n` +
                `📰 *Newsletter:* The Guardian\n\n` +
                `🔗 *Para completar:* [Haz click aquí](${resultado.manualUrl})\n\n` +
                `💡 *Nota:* Algunos newsletters requieren confirmación manual para verificar tu consentimiento.`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                }
            );
        } else {
            await bot.editMessageText(
                `❌ *No se pudo automatizar*\n\n` +
                `📧 Email: ${email}\n` +
                `📰 The Guardian\n\n` +
                `🔗 *Suscripción manual:* [Haz click aquí](${resultado.manualUrl})\n\n` +
                `⚠️ Algunos servicios requieren suscripción manual por seguridad.`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                }
            );
        }

    } catch (error) {
        await bot.editMessageText(
            `❌ *Error inesperado:*\n\n${error.message}\n\n` +
            `🔗 Suscripción manual: https://www.theguardian.com/email`,
            {
                chat_id: chatId,
                message_id: progressMsg.message_id,
                parse_mode: 'Markdown'
            }
        );
    }
});

// Nuevo comando /suscribir con múltiples opciones
bot.onText(/\/suscribir (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim();
    
    const newsletters = [
        {
            name: '📰 The Guardian',
            url: 'https://www.theguardian.com/email',
            description: 'Noticias internacionales'
        },
        {
            name: '🚀 TechCrunch',
            url: 'https://techcrunch.com/newsletters/',
            description: 'Startups y tecnología'
        },
        {
            name: '🔬 MIT Technology Review',
            url: 'https://www.technologyreview.com/newsletter/',
            description: 'Ciencia e innovación'
        },
        {
            name: '🛍️ Product Hunt',
            url: 'https://www.producthunt.com/newsletter',
            description: 'Nuevos productos digitales'
        }
    ];

    let message = `📧 *Suscripciones disponibles para:* ${email}\n\n`;
    
    newsletters.forEach((newsletter, index) => {
        message += `${index + 1}. *${newsletter.name}*\n`;
        message += `   📖 ${newsletter.description}\n`;
        message += `   🔗 [Suscribirse](${newsletter.url})\n\n`;
    });

    message += `💡 *Instrucciones:*\n`;
    message += `1. Haz click en los links\n`;
    message += `2. Ingresa tu email: ${email}\n`;
    message += `3. Confirma la suscripción\n\n`;
    message += `✅ *Suscripción ética con consentimiento*`;

    bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [{ text: "📰 The Guardian", url: "https://www.theguardian.com/email" }],
                [{ text: "🚀 TechCrunch", url: "https://techcrunch.com/newsletters/" }],
                [{ text: "🔬 MIT Tech Review", url: "https://www.technologyreview.com/newsletter/" }]
            ]
        }
    });
});

// Comando /newsletters mejorado
bot.onText(/\/newsletters/, (msg) => {
    const chatId = msg.chat.id;
    
    const message = `
📋 *Sistema de Suscripción Ética*

🤖 *Comandos disponibles:*
/subs [email] - Proceso automático (si está disponible)
/suscribir [email] - Links directos para suscripción manual
/newsletters - Esta ayuda

⚠️ *Por qué suscripción manual?*
- Respetamos tu consentimiento explícito
- Cumplimos con leyes de protección de datos
- Evitamos spam y prácticas no éticas

✅ *Recomendación:* Usa /suscribir para links directos
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});