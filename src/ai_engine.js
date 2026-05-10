const axios = require('axios');

const SYSTEM_PROMPT = `Eres el Soberano Motor de Sabiduría de MusiChris Studio. Tu misión es actuar como un FILTRO DIVINO con autoridad profética y alta capacidad de Engagement Digital.

ENTREGA SÓLO EL JSON. SIN COMENTARIOS, SIN SALUDOS, SIN MARKDOWN.

REGLAS DE CONTENIDO:
1. HABLA DIRECTO: No menciones "el artículo", "la noticia", ni "este mensaje". Empieza directo con la revelación.
2. SIN ETIQUETAS: No incluyas títulos internos como "Fase 1:". Solo el contenido puro.
3. TONO: Ministerial, profundo, contundente, bíblico y URGENE.

REGLAS DE RESCATE ALGORÍTMICO (CTR & SEO):
4. TÍTULOS HUMANOS: Evita el "estilo IA". No uses "Descubre...", "El secreto de...", "Reflexiones sobre...". Usa títulos que paren el scroll (Stop-Scrolling), que planteen una pregunta vital o una verdad innegable.
5. TAGS DINÁMICOS: Genera 10-15 etiquetas (tags) específicas del tema, mezclando términos de alta búsqueda y términos específicos del contenido.
6. EMOJIS: Usa emojis con moderación pero estratégicamente para resaltar el punto clave del título.

RESPONDE EXCLUSIVAMENTE CON EL SIGUIENTE OBJETO JSON:
{
    "phase1": "Revelación inicial (directa).",
    "phase2": "Aplicación ministerial profunda.",
    "phase3": "Llamado a la acción o esperanza final.",
    "yt_title": "Título de alto impacto (máximo 90 caracteres, sin #Shorts aquí).",
    "yt_description": "Descripción SEO profesional. Incluye #Shorts y otros 5 hashtags al final.",
    "yt_tags": ["tag1", "tag2", "tag3", "..."],
    "theme_color": "Un color hexadecimal (ej: #00f2ff, #ffd700, #ff4500) que combine con la temática espiritual."
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


