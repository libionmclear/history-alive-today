import https from 'https';
import fs from 'fs';
import path from 'path';

const DATA_FILE = 'src/lib/data.ts';
const CONTENT_FILE = 'src/lib/articleContent.ts';
const WP_IP = '160.153.0.37';
const WP_HOST = 'historyalivetoday.com';

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

function downloadFromWP(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    // Extract the path from the URL
    const urlObj = new URL(url);
    const reqPath = urlObj.pathname;

    const options = {
      hostname: WP_IP,
      port: 443,
      path: reqPath,
      method: 'GET',
      headers: {
        'Host': WP_HOST,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      rejectUnauthorized: false, // SSL cert won't match the IP
    };

    const req = https.request(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        // If redirect goes to same host, follow it via IP
        if (loc.startsWith('/') || loc.includes(WP_HOST)) {
          const newPath = loc.startsWith('/') ? loc : new URL(loc).pathname;
          const newOpts = { ...options, path: newPath };
          https.request(newOpts, (res2) => {
            if (res2.statusCode !== 200) {
              reject(new Error(`HTTP ${res2.statusCode}`));
              return;
            }
            const file = fs.createWriteStream(destPath);
            res2.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
          }).on('error', reject).end();
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const urls = extractUrls();
  console.log(`Found ${urls.length} unique image URLs`);

  let success = 0, failed = 0, skipped = 0;
  const failures = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const localPath = urlToLocalPath(url);
    if (!localPath) continue;
    const destPath = path.join('public', localPath);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      skipped++;
      continue;
    }

    const fname = path.basename(url);
    try {
      process.stdout.write(`  [${i+1}/${urls.length}] ${fname}...`);
      await downloadFromWP(url, destPath);

      // Verify file size
      const stat = fs.statSync(destPath);
      if (stat.size < 500) {
        fs.unlinkSync(destPath);
        throw new Error('File too small (likely HTML error page)');
      }

      console.log(` OK (${(stat.size/1024).toFixed(0)}KB)`);
      success++;
      await sleep(200);
    } catch (err) {
      console.log(` FAIL: ${err.message}`);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      failures.push({ url, error: err.message });
      failed++;
      await sleep(300);
    }
  }

  console.log(`\nResult: ${success} downloaded, ${skipped} already existed, ${failed} failed`);

  if (failures.length) {
    console.log(`\nFailed (${failures.length}):`);
    failures.forEach(f => console.log(`  ${path.basename(f.url)} - ${f.error}`));
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
  console.log('\nDone!');
}

main().catch(console.error);
