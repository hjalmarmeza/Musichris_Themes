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
    const videoTitle = (phases.yt_title || phases.title || "MusiChris Theme Video").replace(/"/g, "'");
    const videoDesc = (phases.yt_description || phases.description || "").replace(/"/g, "'");

    console.log(`✅ Guion forjado con éxito: ${videoTitle}`);
    
    // 2. Renderizar video
    const outputName = `THEME_${Date.now()}.mp4`;
    const filePath = await renderThemeVideo(phases, outputName);
    console.log(`✅ Video renderizado con éxito en: ${filePath}`);
    
    // 3. Publicar en YouTube
    console.log(`📤 Publicando en YouTube Shorts: ${videoTitle}...`);
    
    const { spawnSync } = require('child_process');
    const pythonProcess = spawnSync('python3', [
        'src/youtube_engine.py',
        filePath,
        videoTitle,
        videoDesc
    ], { encoding: 'utf-8' });

    const output = pythonProcess.stdout || "";
    const errorOutput = pythonProcess.stderr || "";

    console.log(output);
    if (errorOutput) console.error("⚠️ Log de Python:", errorOutput);
    
    if (output.includes('✅ ÉXITO')) {
        console.log("💎 MISIÓN CUMPLIDA: Video en línea.");
    } else {
        console.error("❌ Falló la subida. Revisa el log de arriba.");
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
