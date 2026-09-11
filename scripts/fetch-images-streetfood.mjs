// Downloads the eleven Wikimedia images for "The Ancient Origins of Fast Food".
// Nine are public domain or CC0. Two need a credit line, already written into the captions:
//   ostia-bar-interior.jpg  — photo Marie-Lan Nguyen (CC BY 2.5)
//   ostia-food-painting.jpg — photo MumblerJamie (CC BY-SA 2.0)
// Run from the repo root:  node scripts/fetch-images-streetfood.mjs

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join('public', 'images', 'uploads', '2026', '09');

const FILES = [
  { name: 'pompeii-counter-vetutius.jpg',      commons: 'Pompeii, Thermopolium of Vetutius Placidus (48443399176).jpg', width: 1800 },
  { name: 'greek-comic-actor.jpg',             commons: 'Figurine of an actor BM GR1866.4-15.161.jpg',                   width: 1200 },
  { name: 'pompeii-counter-vi-8-8.jpg',        commons: 'Pompeii, Thermopolium (VI.8.8) (48443651951).jpg',              width: 1800 },
  { name: 'vetutius-shrine-fresco.jpg',        commons: 'Thermopolium Lucius Vetutius Placidus Pompeii.jpg',             width: 1800 },
  { name: 'pompeii-loaf-engraving-1832.jpg',   commons: 'Bread discovered in Pompeii.jpg',                               width: null },
  { name: 'herculaneum-bread-figs.jpg',        commons: "Two figs and a loaf of bread, the most modest and frugal of foods - wall painting from Herculaneum, buried by Vesuvius' eruption on 79 AD (38846553561).jpg", width: 1400 },
  { name: 'ostia-bar-interior.jpg',            commons: 'Caseggiato del Termopolio Ostia Antica 2006-09-08 n1.jpg',      width: 1600 },
  { name: 'ostia-food-painting.jpg',           commons: 'House of the Bar 09.jpg',                                      width: 1600 },
  { name: 'pompeii-bakery-lantern-slide.jpg',  commons: 'Bakery in Pompeii - DPLA - fc0a9cfb4f68982d5dc86b0b71cdf85a.jpg', width: 1500 },
  { name: 'pompeii-tavern-serving-1882.jpg',   commons: 'Tavern scene from VI 14, 35 (Caupona of Salvius) by Geremia Discanno pub 1882.jpg', width: 1600 },
  { name: 'pompeii-tavern-dice-1882.jpg',      commons: 'Tavern scene from VI 14, 36 (Caupona of Salvius) by Geremia Discanno pub 1882.jpg', width: 1600 },
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

console.log('\nDone. Nine are public domain or CC0; the two Ostia photos carry their credit in the caption.');
