import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DATA_FILE = 'src/lib/data.ts';
const CONTENT_FILE = 'src/lib/articleContent.ts';

function extractUrls() {
  const urls = new Set();
  const regex = /https:\/\/historyalivetoday\.com\/wp-content\/uploads\/[^'"\s)]+/g;
  for (const file of [DATA_FILE, CONTENT_FILE]) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) urls.add(match[0]);
    regex.lastIndex = 0;
  }
  return [...urls];
}

function urlToLocalPath(url) {
  const idx = url.indexOf('/wp-content/uploads/');
  if (idx === -1) return null;
  return '/images/uploads/' + url.substring(idx + '/wp-content/uploads/'.length);
}

function download(url, destPath, attempt = 1) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const follow = (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        (loc.startsWith('https') ? https : http)
          .get(loc, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, follow)
          .on('error', reject);
        return;
      }
      if (res.statusCode === 429) {
        reject(new Error('RATE_LIMITED'));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    };

    const waybackUrl = `https://web.archive.org/web/2024if_/${url}`;
    https.get(waybackUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, follow).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const urls = extractUrls();
  console.log(`Found ${urls.length} unique image URLs`);

  let success = 0, failed = 0;
  const failures = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const localPath = urlToLocalPath(url);
    if (!localPath) continue;
    const destPath = path.join('public', localPath);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
      console.log(`  [${i+1}/${urls.length}] EXISTS: ${path.basename(url)}`);
      success++;
      continue;
    }

    let downloaded = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(`  [${i+1}/${urls.length}] ${attempt > 1 ? `(retry ${attempt}) ` : ''}${path.basename(url)}`);
        await download(url, destPath, attempt);
        downloaded = true;
        break;
      } catch (err) {
        if (err.message === 'RATE_LIMITED') {
          const wait = attempt * 5000;
          console.log(`    Rate limited, waiting ${wait/1000}s...`);
          await sleep(wait);
        } else if (attempt < 4) {
          await sleep(2000);
        } else {
          console.log(`    FAILED: ${err.message}`);
        }
      }
    }

    if (downloaded) {
      success++;
      await sleep(1500); // 1.5s between downloads
    } else {
      failures.push(url);
      failed++;
    }
  }

  console.log(`\nDownloaded: ${success}, Failed: ${failed}`);
  if (failures.length) {
    console.log('Failed:');
    failures.forEach(u => console.log(`  ${u}`));
  }

  // Update source files
  console.log('\nUpdating source files...');
  for (const file of [DATA_FILE, CONTENT_FILE]) {
    let content = fs.readFileSync(file, 'utf-8');
    let count = 0;
    for (const url of urls) {
      const localPath = urlToLocalPath(url);
      if (!localPath) continue;
      if (!fs.existsSync(path.join('public', localPath))) continue;
      while (content.includes(url)) { content = content.replace(url, localPath); count++; }
    }
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`  ${file}: ${count} URLs replaced`);
  }
  console.log('Done!');
}

main().catch(console.error);
