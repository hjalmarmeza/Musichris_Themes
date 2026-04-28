const { execSync } = require('child_process');
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
    
    const runGraphics = (title, body, output) => {
        execSync(`python3 src/graphics_engine.py "${title}" "${body}" "${output}"`);
    };

    runGraphics("", phases.phase1, p1Card);
    runGraphics("", phases.phase2, p2Card);
    runGraphics("", phases.phase3, p3Card);
    // Cierre con layout especial WOW Premium
    runGraphics("CIERRE", "", p4Card);

    console.log('🎞️  Iniciando renderizado FFmpeg con Logo Animado...');

    // Template and assets
    const bgVideo = path.join(assetsDir, 'Fondo_theme.mp4');
    const animatedLogo = path.join(assetsDir, 'music/Logo Hjalmar Animado.mp4');
    
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

    // Filter complex with smooth FADE transitions (1s fade in/out)
    const filter = `
        [0:v] scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1 [bg];
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
        fs.existsSync(audioPath) ? `-i "${audioPath}"` : '', // 6
        `-filter_complex "${filter}"`,
        '-map "[v]"',
        fs.existsSync(audioPath) ? '-map 6:a -t 60' : '',
        '-c:v libx264 -preset fast -pix_fmt yuv420p -shortest',
        `"${finalOutput}"`
    ].join(' ');

    execSync(ffmpegCmd);

    // Cleanup temp cards
    fs.unlinkSync(p1Card);
    fs.unlinkSync(p2Card);
    fs.unlinkSync(p3Card);

    console.log(`✅ Video renderizado con éxito: ${finalOutput}`);
    return finalOutput;
}

module.exports = { renderThemeVideo };
