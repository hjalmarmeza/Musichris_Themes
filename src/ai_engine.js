const axios = require('axios');

async function forgeThemeScript(topic) {
    const apiKey = process.env.CEREBRAS_API_KEY || process.env.DEEPSEEK_API_KEY;
    const baseURL = "https://api.cerebras.ai/v1"; 

    console.log(`🚀 Usando CEREBRAS AI para forjar tema: "${topic}"...`);

    try {
        const response = await axios.post(`${baseURL}/chat/completions`, {
            model: "llama3.1-8b",
            messages: [
                {
                    role: "system",
                    content: `Eres el Soberano Motor de Sabiduría de MusiChris Studio. Tu misión es actuar como un FILTRO DIVINO con autoridad profética.
                    
                    Debes analizar la fuente y responder con sabiduría bíblica contundente.
                    
                    NO INCLUYAS NINGÚN TIPO DE ANÁLISIS, EXPLICACIÓN O PREÁMBULO. RESPONDE EXCLUSIVAMENTE CON EL SIGUIENTE OBJETO JSON:
                    {
                        "phase1": "Resumen del hecho (aprox 35 palabras).",
                        "phase2": "Declaración de la Voluntad de Dios (aprox 35 palabras).",
                        "phase3": "Mensaje de Esperanza y Acción (aprox 35 palabras).",
                        "yt_title": "Título viral para YouTube Shorts.",
                        "yt_description": "Descripción SEO."
                    }`
                },
                {
                    role: "user",
                    content: `TEMA: "${topic}"`
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        let content = response.data.choices[0].message.content;
        console.log("📥 Respuesta recibida del motor...");
        
        // Extracción robusta de JSON
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("❌ No se encontró un objeto JSON válido en la respuesta.");
            throw new Error("Respuesta de IA malformada.");
        }

        content = content.substring(firstBrace, lastBrace + 1);
        return JSON.parse(content);

    } catch (error) {
        console.error("❌ Error en la Forja IA:", error.response?.data || error.message);
        throw new Error("El motor de sabiduría no pudo procesar el tema. Verifica la conexión.");
    }
}

module.exports = { forgeThemeScript };
