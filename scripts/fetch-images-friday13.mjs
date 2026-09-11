// Downloads the two Wikimedia images for "Who Cursed Friday the 13th?".
// The lead image (templar-arrest-1307.jpg) is already in the repo — this script skips it.
// Run from the repo root:  node scripts/fetch-images-friday13.mjs

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join('public', 'images', 'uploads', '2026', '09');

const FILES = [
  {
    name: 'templars-burning-1314.jpg',
    commons: 'Templars Burning.jpg',
    width: null, // 952 x 956 native, use as-is
  },
  {
    name: 'rossini-1829.jpg',
    commons: 'Rossini by Grevedon.jpg',
    width: 1200, // original is 5003 x 4650 / 4.4 MB — far too big for the page
  },
];

fs.mkdirSync(OUT, { recursive: true });

for (const f of FILES) {
  const dest = path.join(OUT, f.name);

  if (fs.existsSync(dest)) {
    console.log(`SKIP  ${f.name} (already there)`);
    continue;
  }

  const url =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(f.commons) +
    (f.width ? `?width=${f.width}` : '');

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'historyalivetoday.com image fetch (contact: marco)' },
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`OK    ${f.name}  ${(buf.length / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.log(`FAIL  ${f.name}  ${err.message}`);
    console.log(`      page: https://commons.wikimedia.org/wiki/File:${f.commons.replace(/ /g, '_')}`);
  }
}

console.log('\nDone. Both files are public domain — no credit line needed.');
