const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function renderThemeVideo(phases, outputName) {
    const assetsDir = path.resolve(__dirname, '../assets');
    const outputDir = path.resolve(__dirname, '../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = Date.now();
    const p1Card = path.join(outputDir, `p1_${timestamp}.png`);
    const p2Card = path.join(outputDir, `p2_${timestamp}.png`);
    const p3Card = path.join(outputDir, `p3_${timestamp}.png`);
    const p4Card = path.join(outputDir, `p4_${timestamp}.png`);
    const finalOutput = path.join(outputDir, outputName);

    console.log('🎨 Generando capas gráficas...');
    
    const runGraphics = (title, body, output, color) => {
        const result = spawnSync('python3', ['src/graphics_engine.py', title, body, output, color || "#00f2ff"], { encoding: 'utf-8' });
        if (result.status !== 0) {
            console.error(`❌ Error en graphics_engine.py:\n${result.stderr}`);
            throw new Error(`Fallo al generar gráfico: ${output}`);
        }
    };


    runGraphics("", phases.phase1, p1Card, phases.theme_color);
    runGraphics("", phases.phase2, p2Card, phases.theme_color);
    runGraphics("", phases.phase3, p3Card, phases.theme_color);
    // Cierre con layout especial WOW Premium
    runGraphics("CIERRE", "", p4Card, phases.theme_color);

    console.log('🎞️  Iniciando renderizado FFmpeg con Logo Animado...');
    const animatedLogo = path.join(assetsDir, 'music/Logo Hjalmar Animado.mp4');

    // Dynamic Background Selection
    let bgVideo = path.join(assetsDir, 'Fondo_theme.mp4');
    const backgroundsDir = path.join(assetsDir, 'backgrounds');
    
    let potentialBGs = [];
    if (fs.existsSync(backgroundsDir)) {
        potentialBGs = fs.readdirSync(backgroundsDir).filter(f => f.endsWith('.mp4'));
    }

    if (potentialBGs.length > 0) {
        const randomBG = potentialBGs[Math.floor(Math.random() * potentialBGs.length)];
        bgVideo = path.join(backgroundsDir, randomBG);
        console.log(`🌍 Fondo Internacional seleccionado: ${randomBG}`);
    } else {
        // Fallback a assets raíz (excluyendo logos)
        const rootBGs = fs.readdirSync(assetsDir).filter(f => f.endsWith('.mp4') && !f.includes('Logo'));
        if (rootBGs.length > 0) {
            const randomBG = rootBGs[Math.floor(Math.random() * rootBGs.length)];
            bgVideo = path.join(assetsDir, randomBG);
            console.log(`🎬 Fondo local seleccionado: ${randomBG}`);
        }
    }
    
    // Audio Selection
    const musicDir = path.join(assetsDir, 'music');
    let audioPath = path.join(assetsDir, 'theme_audio.mp3');

    if (fs.existsSync(musicDir)) {
        const musicFiles = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
        const officialTheme = 'Alas_del_Alba.wav';
        if (musicFiles.includes(officialTheme)) {
            audioPath = path.join(musicDir, officialTheme);
        } else if (musicFiles.length > 0) {
            const randomMusic = musicFiles[Math.floor(Math.random() * musicFiles.length)];
            audioPath = path.join(musicDir, randomMusic);
        }
    }

    // Filter complex with smooth FADE transitions (1s fade in/out) and Ken Burns Background
    const filter = `
        [0:v] scale=1080*1.4:1920*1.4:force_original_aspect_ratio=increase,zoompan=z='zoom+0.0003':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920,setsar=1 [bg];
        [1:v] format=rgba,fade=t=in:st=0:d=1:alpha=1,fade=t=out:st=15:d=1:alpha=1 [c1];
        [2:v] format=rgba,fade=t=in:st=16:d=1:alpha=1,fade=t=out:st=31:d=1:alpha=1 [c2];
        [3:v] format=rgba,fade=t=in:st=32:d=1:alpha=1,fade=t=out:st=47:d=1:alpha=1 [c3];
        [4:v] format=rgba,fade=t=in:st=48:d=1:alpha=1,fade=t=out:st=59:d=1:alpha=1 [c4];
        [5:v] scale=800:-1,colorkey=0x000000:0.1:0.1,format=yuva420p,fade=t=in:st=48:d=1:alpha=1,fade=t=out:st=59:d=1:alpha=1 [logo];
        [bg][c1] overlay=0:0 [v1];
        [v1][c2] overlay=0:0 [v2];
        [v2][c3] overlay=0:0 [v3];
        [v3][c4] overlay=0:0 [v4];
        [v4][logo] overlay=(W-w)/2:(H-h)/2-150 [v]
    `.replace(/\s+/g, ' ').trim();

    const ffmpegCmd = [
        'ffmpeg -y',
        `-stream_loop -1 -t 60 -i "${bgVideo}"`, // 0 (Video Background)
        `-loop 1 -t 60 -i "${p1Card}"`,        // 1
        `-loop 1 -t 60 -i "${p2Card}"`,        // 2
        `-loop 1 -t 60 -i "${p3Card}"`,        // 3
        `-loop 1 -t 60 -i "${p4Card}"`,        // 4
        `-stream_loop -1 -i "${animatedLogo}"`, // 5
        fs.existsSync(audioPath) ? `-i "${audioPath}"` : '', // 6 (Condicional)
        `-filter_complex "${filter}"`,
        '-map "[v]"',
        (fs.existsSync(audioPath) && audioPath !== "") ? `-map 6:a -t 60` : '-t 60', // Blindaje de mapeo
        '-c:v libx264 -preset fast -pix_fmt yuv420p -shortest',
        `"${finalOutput}"`
    ].filter(arg => arg !== '').join(' ');

    console.log(`🎬 Ejecutando: ${ffmpegCmd}`);
    execSync(ffmpegCmd);


    // Cleanup temp cards
    fs.unlinkSync(p1Card);
    fs.unlinkSync(p2Card);
    fs.unlinkSync(p3Card);

    console.log(`✅ Video renderizado con éxito: ${finalOutput}`);
    return finalOutput;
}

module.exports = { renderThemeVideo };
