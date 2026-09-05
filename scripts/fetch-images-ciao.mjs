// Downloads the four article images for
// "Ciao Really Means 'I Am Your Slave'"
// from Wikimedia Commons into public/images/uploads/2026/09/.
//
// Run from the repo root:   node scripts/fetch-images-ciao.mjs
//
// Every file was checked on Commons: file opened, licence read, subject
// confirmed. All four are free of obligations — three public domain, one
// "no restrictions". Nothing here needs a credit line.

import https from 'https';
import fs from 'fs';
import path from 'path';

const DEST_DIR = 'public/images/uploads/2026/09';
const UA = 'HistoryAliveToday/1.0 (article images; contact: marco.bellini@gmail.com)';

const IMAGES = [
  {
    out: 'venice-rialto-carpaccio.jpg',
    commons: 'Accademia - Miracle of the Holy Cross at Rialto by Vittore Carpaccio.jpg',
    licence: 'Public domain — Carpaccio c.1496, Gallerie dell’Accademia',
  },
  {
    out: 'giovanni-verga-portrait.jpg',
    commons: 'Portrait of Giovanni Verga.jpg',
    licence: 'Public domain — photograph no later than 1920',
  },
  {
    out: 'hemingway-milan-1918.jpg',
    commons: 'Ernest Hemingway in Milan 1918 retouched.jpg',
    licence: 'Public domain — portrait by Ermeni Studios, 1918',
  },
  {
    out: 'italian-emigrants-ellis-island-1905.jpg',
    commons: 'An Italian mother and child just arrived at Ellis Island, NMFF.000705 "Peace" (6620099783).jpg',
    licence: 'No restrictions — Lewis Hine, 1905, via Preus Museum / Flickr Commons',
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
      failures.push(img);
      failed++;
      await sleep(400);
    }
  }

  console.log(`\nResult: ${ok} downloaded, ${skipped} already present, ${failed} failed.`);

  if (failures.length) {
    console.log('\nFailed — download these by hand from Commons:');
    for (const f of failures) {
      console.log(`  ${f.out}`);
      console.log(`    https://commons.wikimedia.org/wiki/File:${f.commons.replace(/ /g, '_')}`);
    }
  }

  console.log('\nNo attribution is required for any of these four images.\n');
}

main().catch(console.error);
