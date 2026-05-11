const { forgeThemeScript } = require('./ai_engine');
const { renderThemeVideo } = require('./video_engine');
const { getLatestDevocional } = require('./services/gmail_reader');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

async function runForge(manualContent) {
    console.log(`🚀 Iniciando Forja Ministerial MusiChris...`);
    
    let contentToForge = manualContent;

    // Si no hay contenido manual, buscamos en Gmail
    if (!contentToForge || contentToForge.trim() === "") {
        console.log("🤖 Modo Automático: Buscando devocional en Gmail...");
        const devocional = await getLatestDevocional();
        if (devocional) {
            contentToForge = `TÍTULO: ${devocional.title}\n\nCONTENIDO: ${devocional.content}`;
        } else {
            console.error("❌ No se encontró devocional en Gmail y no hay tema manual. Abortando.");
            process.exit(1);
        }
    }

    console.log(`📝 Procesando contenido:\n${contentToForge.substring(0, 200)}...`);
    
    // 1. Forjar guion
    const phases = await forgeThemeScript(contentToForge);
    
    // Función de blindaje para metadatos
    const sanitize = (text) => text ? text.replace(/"/g, "'").replace(/[\r\n]+/g, " ").trim() : "";

    const videoTitle = sanitize(phases.yt_title || phases.title || "MusiChris Theme Video");
    const videoDesc = sanitize(phases.yt_description || phases.description || "");

    console.log(`✅ Guion forjado y blindado: ${videoTitle}`);
    
    // 2. Renderizar video
    const outputName = `THEME_${Date.now()}.mp4`;
    const filePath = await renderThemeVideo(phases, outputName);
    console.log(`✅ Video renderizado con éxito en: ${filePath}`);
    
    // 3. Publicar en YouTube
    console.log(`📤 Publicando en YouTube: ${videoTitle}...`);
    
    const videoTags = (phases.yt_tags || []).join(',');
    const { spawnSync } = require('child_process');
    const pythonProcess = spawnSync('python3', [
        'src/youtube_engine.py',
        filePath,
        videoTitle,
        videoDesc,
        videoTags
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
runForge(themeInput).catch(err => {
    console.error("❌ Error en el proceso:", err);
    process.exit(1);
});
