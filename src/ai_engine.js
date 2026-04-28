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
        
        // Extracción robusta de JSON con limpieza de Markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("❌ Respuesta cruda de la IA:", content);
            throw new Error("No se pudo extraer JSON de la respuesta.");
        }

        const jsonString = content.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("❌ Error en la Forja IA:", error.response?.data || error.message);
        throw new Error("El motor de sabiduría no pudo procesar el tema. Verifica la conexión.");
    }
}

module.exports = { forgeThemeScript };
