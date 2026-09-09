// Downloads the three Commons images for
// (the lead illustration, friar-with-cappuccino.jpg, is already committed in the repo)
//
// "Your Cappuccino Is Named After a Monk's Robe"
// from Wikimedia Commons into public/images/uploads/2026/09.
//
// Run from the repo root:   node scripts/fetch-images-cappuccino.mjs
//
// Every file was checked on Commons: file opened, licence read, subject confirmed.

import https from 'https';
import fs from 'fs';
import path from 'path';

const DEST_DIR = 'public/images/uploads/2026/09';
const UA = 'HistoryAliveToday/1.0 (article images; contact: marco.bellini@gmail.com)';

const IMAGES = [
  {
    "out": "capuchin-friar-murbach.jpg",
    "commons": "Capuchin at work by Johann Murbach.jpg",
    "licence": "CC BY-SA 3.0",
    "credit": "MUST CREDIT: Docteur Ralph / Wikimedia Commons / CC BY-SA 3.0"
  },
  {
    "out": "vienna-cafe-griensteidl-1896.jpg",
    "commons": "Cafe-Griensteidl-1896.jpg",
    "licence": "Public domain"
  },
  {
    "out": "cappuccino-cup.jpg",
    "commons": "Cappuccino in original.jpg",
    "licence": "CC BY 2.0",
    "credit": "MUST CREDIT: Vee Satayamas / CC BY 2.0"
  }
];

function get(url, destPath, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('Too many redirects'));
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(get(new URL(res.headers.location, url).toString(), destPath, depth + 1));
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('\nFetching ' + IMAGES.length + ' images into ' + DEST_DIR + '\n');
  let ok = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const img of IMAGES) {
    const destPath = path.join(DEST_DIR, img.out);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      console.log('  SKIP  ' + img.out + ' (already present)'); skipped++; continue;
    }
    const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(img.commons);
    process.stdout.write('  ...   ' + img.out);
    try {
      await get(url, destPath);
      const size = fs.statSync(destPath).size;
      if (size < 500) { fs.unlinkSync(destPath); throw new Error('File too small (likely an error page)'); }
      console.log('\r  OK    ' + img.out + ' (' + (size / 1024).toFixed(0) + ' KB)');
      ok++; await sleep(250);
    } catch (err) {
      console.log('\r  FAIL  ' + img.out + ' - ' + err.message);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      failures.push(img); failed++; await sleep(400);
    }
  }

  console.log('\nResult: ' + ok + ' downloaded, ' + skipped + ' already present, ' + failed + ' failed.');
  if (failures.length) {
    console.log('\nFailed - download these by hand from Commons:');
    for (const f of failures) {
      console.log('  ' + f.out);
      console.log('    https://commons.wikimedia.org/wiki/File:' + f.commons.replace(/ /g, '_'));
    }
  }
  console.log('\nLicence reminders:');
  for (const img of IMAGES) if (img.credit) console.log('  ' + img.out + ' -> ' + img.credit);
  console.log('');
}

main().catch(console.error);
