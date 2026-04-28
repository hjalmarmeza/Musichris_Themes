const { forgeThemeScript } = require('./ai_engine');
const { renderThemeVideo } = require('./video_engine');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

async function runForge(content) {
    console.log(`🚀 Iniciando Forja Ministerial desde GitHub Actions...`);
    console.log(`📝 Tema: ${content}`);
    
    // 1. Forjar guion
    const phases = await forgeThemeScript(content);
    console.log(`✅ Guion forjado con éxito: ${phases.yt_title}`);
    
    // 2. Renderizar video
    const outputName = `THEME_${Date.now()}.mp4`;
    const filePath = await renderThemeVideo(phases, outputName);
    console.log(`✅ Video renderizado con éxito en: ${filePath}`);
    
    // 3. Publicar en YouTube
    console.log(`📤 Publicando en YouTube Shorts...`);
    const command = `python3 src/youtube_engine.py "${filePath}" "${phases.yt_title}" "${phases.yt_description}"`;
    const output = execSync(command).toString();
    console.log(output);
    
    if (output.includes('✅ ÉXITO')) {
        console.log("💎 MISIÓN CUMPLIDA: Video en línea.");
    } else {
        throw new Error("Error en la subida a YouTube.");
    }
}

const themeInput = process.argv.slice(2).join(' ');
if (!themeInput) {
    console.error("❌ Error: Debes proporcionar un tema o noticia para la forja.");
    process.exit(1);
}

runForge(themeInput).catch(err => {
    console.error("❌ Error en el proceso:", err);
    process.exit(1);
});
