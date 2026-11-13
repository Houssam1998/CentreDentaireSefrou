/**
 * Outro des reels → MP4 (1080×1920, 30 i/s, H.264), image par image pour un rendu parfaitement fluide.
 *   npm run ig:reel                              → instagram/export/outro.mp4
 *   npm run ig:reel -- --append ma-video.mp4     → ajoute l'outro à la fin d'une vidéo filmée
 *                                                  (fondu enchaîné, format recadré en 9:16)
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, basename, extname } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outDir = resolve(root, 'export');
const FPS = 30;
const XFADE = 0.45; // durée du fondu entre la vidéo et l'outro

const args = process.argv.slice(2);
const appendIdx = args.indexOf('--append');
const appendFile = appendIdx >= 0 ? resolve(process.cwd(), args[appendIdx + 1] ?? '') : null;
if (appendFile && !existsSync(appendFile)) {
  console.error(`Vidéo introuvable : ${appendFile}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const outro = resolve(outDir, 'outro.mp4');

await renderOutro();
if (appendFile) await appendOutro(appendFile);

async function renderOutro() {
  const server = await createServer({ configFile: resolve(root, 'vite.config.js'), logLevel: 'error', server: { port: 5196 } });
  await server.listen();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto(`${server.resolvedUrls.local[0]}reel/outro.html?render=1`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
    const duration = await page.evaluate(() => window.__duration);
    const frames = Math.round(duration * FPS);

    const ff = spawn(ffmpegPath, [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-shortest', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outro,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg a échoué (${c})`)))));

    const el = await page.$('.ig');
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.__seek(t), i / FPS);
      const buf = await el.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 30 === 0) process.stdout.write(`\r  image ${i + 1}/${frames}`);
    }
    ff.stdin.end();
    await done;
    console.log(`\r✓ ${basename(outro)} (${duration.toFixed(1)} s, ${frames} images)`);
  } finally {
    await browser.close();
    await server.close();
  }
}

/** Lit la durée et la présence d'une piste audio avec ffmpeg. */
function probe(file) {
  const { stderr } = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`Impossible de lire ${file}`);
  return { duration: +m[1] * 3600 + +m[2] * 60 + +m[3], audio: /Stream #.*Audio/.test(stderr) };
}

async function appendOutro(file) {
  const a = probe(file);
  const b = probe(outro);
  const offset = Math.max(0, a.duration - XFADE);
  const total = offset + b.duration;
  const out = resolve(outDir, `${basename(file, extname(file))}-avec-outro.mp4`);
  const v = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS},format=yuv420p,setsar=1[v0];` +
    `[1:v]fps=${FPS},format=yuv420p,setsar=1[v1];[v0][v1]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}[v]`;
  const au = a.audio
    ? `;[0:a]aresample=44100,afade=t=out:st=${offset.toFixed(3)}:d=${XFADE},apad,atrim=0:${total.toFixed(3)}[a]`
    : `;[1:a]adelay=${Math.round(offset * 1000)}|${Math.round(offset * 1000)},apad,atrim=0:${total.toFixed(3)}[a]`;
  const r = spawnSync(ffmpegPath, [
    '-y', '-loglevel', 'error', '-i', file, '-i', outro,
    '-filter_complex', v + au, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg a échoué pendant l’assemblage');
  console.log(`✓ ${basename(out)} (${total.toFixed(1)} s)`);
}
