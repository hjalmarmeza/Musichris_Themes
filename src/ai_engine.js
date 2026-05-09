const axios = require('axios');

const SYSTEM_PROMPT = `Eres el Soberano Motor de Sabiduría de MusiChris Studio. Tu misión es actuar como un FILTRO DIVINO con autoridad profética.

ENTREGA SÓLO EL JSON. SIN COMENTARIOS, SIN SALUDOS, SIN MARKDOWN.

REGLAS CRÍTICAS:
1. HABLA DIRECTO: No menciones "el artículo", "la noticia", "el link" ni "este texto". No digas "el artículo aborda". Empieza directo con el mensaje.
2. SIN ETIQUETAS: No incluyas títulos como "Declaración de la Voluntad de Dios" o "Mensaje de Esperanza". Solo escribe el contenido puro.
3. TONO: Ministerial, profundo, contundente y bíblico.

RESPONDE EXCLUSIVAMENTE CON EL SIGUIENTE OBJETO JSON:
{
    "phase1": "El mensaje central del hecho (directo, sin preámbulos).",
    "phase2": "La aplicación espiritual/ministerial directa.",
    "phase3": "Llamado a la acción o esperanza final.",
    "yt_title": "Título viral (debe incluir #Shorts y emojis).",
    "yt_description": "Descripción SEO completa con 5-8 hashtags relevantes."
}`;

async function forgeThemeScript(topic) {
    const keys = {
        cerebras: process.env.CEREBRAS_API_KEY,
        deepinfra: process.env.DEEPINFRA_API_KEY,
        deepseek: process.env.DEEPSEEK_API_KEY
    };

    let response;
    let providerUsed = "";

    // --- NIVEL 1: CEREBRAS (Primario - Ultra Velocidad) ---
    if (keys.cerebras) {
        try {
            console.log(`🚀 Forja Nivel 1: Intentando con CEREBRAS...`);
            response = await axios.post("https://api.cerebras.ai/v1/chat/completions", {
                model: "llama3.1-8b",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `TEMA: "${topic}"` }
                ],
                temperature: 0.7
            }, {
                headers: { 'Authorization': `Bearer ${keys.cerebras}`, 'Content-Type': 'application/json' },
                timeout: 12000
            });
            providerUsed = "CEREBRAS";
        } catch (error) {
            console.error("⚠️ Nivel 1 saturado (Cerebras).");
        }
    }

    // --- NIVEL 2: DEEPINFRA (Respaldo Estable) ---
    if (!providerUsed && keys.deepinfra) {
        try {
            console.log(`📡 Forja Nivel 2: Saltando a DEEPINFRA...`);
            response = await axios.post("https://api.deepinfra.com/v1/openai/chat/completions", {
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `TEMA: "${topic}"` }
                ],
                temperature: 0.7
            }, {
                headers: { 'Authorization': `Bearer ${keys.deepinfra}`, 'Content-Type': 'application/json' },
                timeout: 15000
            });
            providerUsed = "DEEPINFRA";
        } catch (error) {
            console.error("⚠️ Nivel 2 fallido (DeepInfra):", error.message);
        }
    }

    // --- NIVEL 3: DEEPSEEK (Respaldo Final - Alta Calidad) ---
    if (!providerUsed && keys.deepseek) {
        try {
            console.log(`💎 Forja Nivel 3: Activando DEEPSEEK (Respaldo Final)...`);
            response = await axios.post("https://api.deepseek.com/v1/chat/completions", {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `TEMA: "${topic}"` }
                ],
                temperature: 0.7
            }, {
                headers: { 'Authorization': `Bearer ${keys.deepseek}`, 'Content-Type': 'application/json' },
                timeout: 20000
            });
            providerUsed = "DEEPSEEK";
        } catch (error) {
            console.error("❌ Todos los niveles han fallado.");
            throw new Error("No hay motores de sabiduría disponibles en este momento.");
        }
    }

    if (!response) {
        throw new Error("Error crítico: No hay API Keys configuradas para la forja ministerial.");
    }

    let content = response.data.choices[0].message.content;
    console.log(`✅ Forja completada exitosamente vía ${providerUsed}.`);
    
    // Extracción de JSON
    try {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error("JSON no encontrado");
        const jsonString = content.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("❌ Respuesta inválida de la IA:", content);
        throw new Error("El motor de sabiduría entregó un formato incompatible.");
    }
}

module.exports = { forgeThemeScript };


