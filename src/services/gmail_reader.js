const { google } = require('googleapis');
const fs = require('fs');

async function getLatestDevocional() {
    console.log('📧 Buscando devocional de devocional@vnpem.org.mx...');
    
    // 1. Cargar Credenciales y Token (Buscando en múltiples ubicaciones posibles)
    const credPath = fs.existsSync('src/client_secrets.json') ? 'src/client_secrets.json' : 'credentials.json';
    const credentials = JSON.parse(process.env.YOUTUBE_CREDENTIALS_JSON || fs.readFileSync(credPath));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        let tokenData;
        const rawToken = process.env.YOUTUBE_TOKEN_JSON;
        
        if (rawToken) {
            try {
                // Intento 1: ¿Es JSON directo?
                tokenData = JSON.parse(rawToken);
            } catch (e) {
                // Intento 2: ¿Es Base64?
                try {
                    tokenData = JSON.parse(Buffer.from(rawToken, 'base64').toString());
                } catch (e2) {
                    throw new Error("El secreto YOUTUBE_TOKEN_JSON no tiene un formato válido (ni JSON ni Base64)");
                }
            }
        } else {
            tokenData = require('../../token.json');
        }
    oAuth2Client.setCredentials(tokenData);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    try {
        // 2. Buscar correos del remitente específico
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'from:devocional@vnpem.org.mx',
            maxResults: 1
        });

        if (!res.data.messages || res.data.messages.length === 0) {
            console.log('⚠️ No se encontraron correos de este remitente.');
            return null;
        }

        // 3. Obtener el contenido del mensaje
        const messageId = res.data.messages[0].id;
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId
        });

        // 4. Extraer Asunto, Fecha y Cuerpo
        const headers = message.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject').value;
        const internalDate = parseInt(message.data.internalDate);
        const messageDate = new Date(internalDate);
        const today = new Date();

        /* VALIDACIÓN DE SEGURIDAD TEMPORALMENTE DESACTIVADA PARA PRUEBA
        if (messageDate.getUTCDate() !== today.getUTCDate() || 
            messageDate.getUTCMonth() !== today.getUTCMonth()) {
            console.log(`⚠️ Seguridad: El correo más reciente es del ${messageDate.toLocaleDateString()}, pero hoy es ${today.toLocaleDateString()}.`);
            console.log("Abortando para evitar publicar contenido antiguo.");
            return null;
        }
        */

        // El cuerpo puede venir en diferentes formatos (plain o html)
        let body = '';
        if (message.data.payload.parts) {
            const part = message.data.payload.parts.find(p => p.mimeType === 'text/plain') || message.data.payload.parts[0];
            if (part.body.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        } else {
            body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
        }

        console.log(`✅ Devocional encontrado: "${subject}"`);
        
        return {
            title: subject,
            content: body,
            date: new Date(parseInt(message.data.internalDate)).toISOString()
        };

    } catch (error) {
        console.error('❌ Error leyendo Gmail:', error.message);
        throw error;
    }
}

module.exports = { getLatestDevocional };
