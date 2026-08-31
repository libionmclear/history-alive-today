// Downloads the seven article images for
// "Why Does an Hour Have 60 Minutes? Blame Babylon"
// from Wikimedia Commons into public/images/uploads/2026/08/.
//
// Run from the repo root:   node scripts/fetch-images-60-minutes.mjs
//
// Every file was checked individually on Commons: file opened, licence read,
// subject confirmed. Five are public domain / CC0. Two are CC BY-SA and the
// required credit is already written into the captions in
// src/lib/articleContent.ts — do not remove those lines.

import https from 'https';
import fs from 'fs';
import path from 'path';

const DEST_DIR = 'public/images/uploads/2026/08';
const UA = 'HistoryAliveToday/1.0 (article images; contact: marco.bellini@gmail.com)';

const IMAGES = [
  {
    out: 'babylonian-tablet-ybc-7289.jpg',
    commons: 'YBC-7289-OBV-labeled.jpg',
    licence: 'CC0 — no credit required',
  },
  {
    out: 'senenmut-astronomical-ceiling.jpg',
    commons: 'Astronomical Ceiling, Tomb of Senenmut MET DT207429.jpg',
    licence: 'CC0 (Met Open Access) — credit optional',
  },
  {
    out: 'ptolemy-almagest-1213.jpg',
    commons: 'Almageste de Ptolémée - BNF Lat16200 f1.jpg',
    licence: 'Public domain (PD-Art), BnF / Gallica',
  },
  {
    out: 'salisbury-cathedral-clock.jpg',
    commons: 'Salisbury Cathedral clock (Feb 2020).jpg',
    licence: 'CC BY-SA 4.0 — MUST CREDIT: Seth Whales / Wikimedia Commons',
  },
  {
    out: 'huygens-pendulum-clock-1673.jpg',
    commons: 'Pendulum or oscillating clock mechanisms, showing escapement mechanism, curved metal strips to check swing of pendulum, and clock with pendulum and weights LCCN92518604.jpg',
    licence: 'Public domain — Library of Congress',
  },
  {
    out: 'french-decimal-pocket-watch.jpg',
    commons: 'Watch-CnAM 21977-IMG 6690-black.jpg',
    licence: 'CC BY-SA 3.0 FR — MUST CREDIT: Rama / Wikimedia Commons',
  },
  {
    out: 'nist-caesium-fountain-clock.jpg',
    commons: 'NIST-F2 cesium fountain atomic clock.jpg',
    licence: 'Public domain — NIST (U.S. federal government)',
  },
];

function get(url, destPath, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('Too many redirects'));
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, url).toString();
          return resolve(get(next, destPath, depth + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      })
      .on('error', reject)
      .setTimeout(60000, function () { this.destroy(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log(`\nFetching ${IMAGES.length} images into ${DEST_DIR}\n`);
  let ok = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const img of IMAGES) {
    const destPath = path.join(DEST_DIR, img.out);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      console.log(`  SKIP  ${img.out} (already present)`);
      skipped++;
      continue;
    }

    const url =
      'https://commons.wikimedia.org/wiki/Special:FilePath/' +
      encodeURIComponent(img.commons);

    process.stdout.write(`  ...   ${img.out}`);
    try {
      await get(url, destPath);
      const size = fs.statSync(destPath).size;
      if (size < 500) {
        fs.unlinkSync(destPath);
        throw new Error('File too small (likely an error page)');
      }
      console.log(`\r  OK    ${img.out} (${(size / 1024).toFixed(0)} KB)`);
      ok++;
      await sleep(250);
    } catch (err) {
      console.log(`\r  FAIL  ${img.out} — ${err.message}`);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      failures.push({ img, err });
      failed++;
      await sleep(400);
    }
  }

  console.log(`\nResult: ${ok} downloaded, ${skipped} already present, ${failed} failed.`);

  if (failures.length) {
    console.log('\nFailed — download these by hand from Commons:');
    for (const f of failures) {
      console.log(`  ${f.img.out}`);
      console.log(`    https://commons.wikimedia.org/wiki/File:${f.img.commons.replace(/ /g, '_')}`);
    }
  }

  console.log('\nLicence reminders:');
  for (const img of IMAGES) {
    if (img.licence.includes('MUST CREDIT')) console.log(`  ${img.out}\n    ${img.licence}`);
  }
  console.log('');
}

main().catch(console.error);
