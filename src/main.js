const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { forgeThemeScript } = require('./ai_engine');
const { renderThemeVideo } = require('./video_engine');
const { execSync } = require('child_process');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// API Endpoint to forge content
app.post('/api/forge', async (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'No content provided' });
    }

    try {
        console.log(`🚀 Solicitud de forja recibida: "${content.substring(0, 50)}..."`);
        const result = await forgeThemeScript(content);
        res.json(result);
    } catch (error) {
        console.error('❌ Error forjando tema:', error);
        res.status(500).json({ error: 'Failed to forge content' });
    }
});

// API Endpoint to render video
app.post('/api/render', async (req, res) => {
    const { phases } = req.body;
    
    if (!phases) {
        return res.status(400).json({ error: 'No phases provided' });
    }

    try {
        const outputName = `THEME_${Date.now()}.mp4`;
        const filePath = await renderThemeVideo(phases, outputName);
        res.json({ 
            message: 'Video renderizado exitosamente', 
            file: outputName,
            fullPath: filePath 
        });
    } catch (error) {
        console.error('❌ Error renderizando video:', error);
        res.status(500).json({ error: 'Failed to render video' });
    }
});

// API Endpoint to publish to YouTube
app.post('/api/publish', async (req, res) => {
    const { filePath, title, description } = req.body;
    
    if (!filePath || !title) {
        return res.status(400).json({ error: 'Faltan datos para la publicación' });
    }

    try {
        console.log(`📤 Publicando en YouTube: ${title}...`);
        const command = `python3 src/youtube_engine.py "${filePath}" "${title}" "${description || ''}"`;
        const output = execSync(command).toString();
        
        console.log(output);
        
        if (output.includes('✅ ÉXITO')) {
            const match = output.match(/URL: (https:\/\/youtu\.be\/\S+)/);
            res.json({ 
                success: true, 
                message: 'Video publicado con éxito', 
                url: match ? match[1] : null 
            });
        } else {
            throw new Error('Fallo en el script de subida');
        }
    } catch (error) {
        console.error('❌ Error publicando en YouTube:', error);
        res.status(500).json({ error: 'Error en la publicación. Revisa la consola para más detalles.' });
    }
});

app.listen(PORT, () => {
    console.log(`
    💎 MusiChris Themes | Universal Forge v1.1
    📡 Servidor corriendo en http://localhost:${PORT}
    ✨ El motor de sabiduría está listo.
    `);
});
