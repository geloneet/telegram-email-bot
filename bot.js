require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');

console.log('🚀 Iniciando bot con función spam...');
console.log('⏰ Hora:', new Date().toLocaleString());

// Verificar configuración
if (!process.env.TELEGRAM_TOKEN) {
    console.error('❌ ERROR: No hay token de Telegram');
    process.exit(1);
}

if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
    console.log('⚠️  Advertencia: No hay configuración de email');
}

// Configurar email (si existe)
let transporter = null;
if (process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        }
    });
    console.log('✅ Configuración de email cargada');
} else {
    console.log('❌ Configuración de email no encontrada');
}

// Crear el bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: true 
});

// Función para enviar email
async function enviarEmail(to, subject, text, numero) {
    if (!transporter) {
        throw new Error('No hay configuración de email');
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USERNAME,
            to: to,
            subject: `${subject} (#${numero})`,
            html: `
                <h1>${subject}</h1>
                <p>${text}</p>
                <p>Email número: <strong>${numero}</strong></p>
                <p>Hora: ${new Date().toLocaleString()}</p>
                <small>Enviado automáticamente por tu bot de Telegram</small>
            `
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;
    
    const mensaje = `
🎉 ¡BOT FUNCIONANDO, ${userName}!

📧 *Comandos disponibles:*
/spam [email] - Enviar emails de prueba
/hola - Saludo simple  
/hora - Hora del servidor
/status - Estado del bot

⚠️ *ADVERTENCIA:* Usa solo para pruebas con tu propio email.
    `;
    
    bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
});

// Comando /spam [email]
bot.onText(/\/spam (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1].trim();
    
    // Validar email básico
    if (!email.includes('@') || !email.includes('.')) {
        return bot.sendMessage(chatId, '❌ Email no válido. Ejemplo: /spam tuemail@gmail.com');
    }

    if (!transporter) {
        return bot.sendMessage(chatId, '❌ Servicio de email no configurado. Revisa las variables SMTP_USERNAME y SMTP_PASSWORD en Railway.');
    }

    // Enviar mensaje de progreso
    const progressMsg = await bot.sendMessage(chatId, 
        `📧 Enviando 5 emails de prueba a: ${email}\n\n⏳ Por favor espera...`,
        { parse_mode: 'Markdown' }
    );

    let exitosos = 0;
    let fallados = 0;
    const resultados = [];

    // Enviar 5 emails de prueba (número seguro)
    for (let i = 1; i <= 5; i++) {
        try {
            const resultado = await enviarEmail(
                email,
                'Prueba de Bot Telegram',
                'Este es un email de prueba enviado automáticamente por tu bot de Telegram.',
                i
            );

            if (resultado.success) {
                exitosos++;
                resultados.push(`✅ Email ${i} enviado`);
            } else {
                fallados++;
                resultados.push(`❌ Email ${i}: ${resultado.error}`);
            }

            // Actualizar mensaje de progreso
            await bot.editMessageText(
                `📧 Enviando emails...\n\n✅ Éxitos: ${exitosos}\n❌ Fallos: ${fallados}\n⏳ Progreso: ${i}/5`,
                {
                    chat_id: chatId,
                    message_id: progressMsg.message_id,
                    parse_mode: 'Markdown'
                }
            );

            // Pequeña pausa entre emails (1 segundo)
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            fallados++;
            resultados.push(`❌ Email ${i}: Error inesperado`);
        }
    }

    // Mensaje final
    const mensajeFinal = `
📊 *Resultado del envío:*

📧 Emails enviados a: ${email}
✅ Éxitos: ${exitosos}
❌ Fallos: ${fallados}

${resultados.join('\n')}

⚠️ *Recuerda:* Solo usar para pruebas.
    `;

    await bot.editMessageText(mensajeFinal, {
        chat_id: chatId,
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
    });
});

// Comando /status
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    
    const status = `
📊 *Estado del Bot:*

🕐 Hora servidor: ${new Date().toLocaleString()}
📧 Email configurado: ${transporter ? '✅ Sí' : '❌ No'}
🚀 Bot activo: ✅ Sí

💡 Usa: /spam tuemail@gmail.com
    `;
    
    bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
});

// Comandos simples de siempre
bot.onText(/\/hola/, (msg) => {
    bot.sendMessage(msg.chat.id, '¡Hola! 👋 Usa /spam para probar los emails.');
});

bot.onText(/\/hora/, (msg) => {
    bot.sendMessage(msg.chat.id, `🕐 Hora del servidor: ${new Date().toLocaleTimeString()}`);
});

// Manejo de errores
bot.on('polling_error', (error) => {
    console.log('❌ Error de polling:', error.code);
});

console.log('✅ Bot con función spam iniciado correctamente');