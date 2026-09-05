// Measures every image under public/images and writes src/lib/imageSizes.ts.
//
// Why this exists: Facebook cannot render a share card on its first scrape
// unless og:image:width and og:image:height are declared. It falls back to
// whatever other image it finds on the page — for us, the preloaded logo.
//
// The dimensions cannot be read at request time on Vercel: public/ is uploaded
// to the CDN and is NOT bundled into the serverless function, so any attempt to
// stat or open those files from a route handler fails. Measuring here, during
// the build, bakes the numbers into the bundle as plain data.
//
// Runs automatically via the `prebuild` script. Safe to run by hand:
//   node scripts/generate-image-sizes.mjs

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = 'public/images';
const OUT = 'src/lib/imageSizes.ts';
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = walk(ROOT).sort();
const sizes = {};
let failed = 0;

for (const file of files) {
  // Key by the public URL path, which is what the article data stores.
  const key = '/' + path.relative('public', file).split(path.sep).join('/');
  try {
    const { width, height } = await sharp(file).metadata();
    if (width && height) sizes[key] = { width, height };
    else throw new Error('no dimensions reported');
  } catch (err) {
    failed++;
    console.warn(`  skip  ${key} — ${err.message}`);
  }
}

const body = `// GENERATED FILE — do not edit by hand.
// Produced by scripts/generate-image-sizes.mjs, which runs on \`npm run build\`.
// Pixel dimensions for images in public/, used to emit og:image:width and
// og:image:height. See the script header for why this is done at build time.

export interface ImageSize {
  width: number;
  height: number;
}

export const imageSizes: Record<string, ImageSize> = {
${Object.entries(sizes)
  .map(([k, v]) => `  ${JSON.stringify(k)}: { width: ${v.width}, height: ${v.height} },`)
  .join('\n')}
};

export function getImageSize(src: string): ImageSize | undefined {
  return imageSizes[src];
}
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Only rewrite when something actually changed, so a no-op build leaves the
// file (and its mtime) alone.
const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
if (previous === body) {
  console.log(`image sizes: ${Object.keys(sizes).length} images, unchanged`);
} else {
  fs.writeFileSync(OUT, body);
  console.log(`image sizes: wrote ${Object.keys(sizes).length} images to ${OUT}`);
}

if (failed) console.log(`image sizes: ${failed} file(s) could not be measured`);
